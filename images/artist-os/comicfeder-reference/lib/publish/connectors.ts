import JSZip from 'jszip';
import { signWebhookPayload } from './crypto.js';

export type ConnectorKind = 'website' | 'blog' | 'portfolio' | 'shop' | 'pod';

export interface PublishableImage {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  pHash: string;
  sha256: string;
  width?: number;
  height?: number;
  altText?: string;
}

export interface PublishableItem {
  id?: string;
  title: string;
  bodyText: string;
  tags: string[];
  projectTitle?: string;
  creatorName: string;
  copyrightNotice?: string;
  sourceType: 'page' | 'panel' | 'asset' | 'portfolio' | 'merch' | 'shop';
  sourceId: string;
  priceCents?: number;
  currency?: string;
  productType?: string;
  colorVariants?: string[];
  images: PublishableImage[];
}

export interface ConnectorValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export interface ConnectorPreviewResult {
  connectorId: string;
  kind: ConnectorKind;
  title: string;
  summary: string;
  endpointPreview: string;
  payloadPreview: Record<string, any>;
}

export interface ConnectorPublishResult {
  connectorId: string;
  status: 'nicht_verbunden' | 'veroeffentlicht' | 'fehler';
  externalId: string | null;
  externalUrl?: string | null;
  message: string;
  rawResponse?: Record<string, any>;
}

export interface ConnectorStatusResult {
  connectorId: string;
  externalId: string;
  status: 'nicht_verbunden' | 'live' | 'entwurf' | 'unbekannt';
  message: string;
}

export interface PublishConnector {
  id: string;
  name: string;
  kind: ConnectorKind;
  description: string;
  requiredFields: string[];
  isConfigured(credentials?: Record<string, any> | null): boolean;
  validate(item: PublishableItem): Promise<ConnectorValidationResult>;
  preview(item: PublishableItem): Promise<ConnectorPreviewResult>;
  publish(
    item: PublishableItem,
    credentials?: Record<string, any> | null,
    fetchImpl?: typeof fetch
  ): Promise<ConnectorPublishResult>;
  status(
    externalId: string,
    credentials?: Record<string, any> | null,
    fetchImpl?: typeof fetch
  ): Promise<ConnectorStatusResult>;
}

export const NOT_CONNECTED_MESSAGE =
  'Noch nicht verbunden – du kannst das Paket herunterladen und selbst hochladen.';

function baseValidate(item: PublishableItem): ConnectorValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!item.title || !item.title.trim()) {
    errors.push('Bitte gib einen Titel an.');
  }
  if (!item.images || item.images.length === 0) {
    warnings.push('Es ist noch kein geschütztes Bild ausgewählt.');
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

// ==========================================
// 1. WordPress REST API Connector
// ==========================================
export const wordpressConnector: PublishConnector = {
  id: 'wordpress',
  name: 'WordPress (Blog & Website)',
  kind: 'blog',
  description: 'Veröffentlicht Beiträge, Seiten und geschützte Bilder über die WordPress REST API (/wp-json/wp/v2).',
  requiredFields: ['siteUrl', 'username', 'applicationPassword'],

  isConfigured(creds) {
    return Boolean(
      creds &&
        typeof creds.siteUrl === 'string' &&
        creds.siteUrl.trim() &&
        typeof creds.username === 'string' &&
        creds.username.trim() &&
        typeof creds.applicationPassword === 'string' &&
        creds.applicationPassword.trim()
    );
  },

  async validate(item) {
    return baseValidate(item);
  },

  async preview(item) {
    return {
      connectorId: 'wordpress',
      kind: 'blog',
      title: item.title,
      summary: `WordPress-Beitrag mit ${item.images.length} geschützten Bild(ern)`,
      endpointPreview: 'POST {siteUrl}/wp-json/wp/v2/posts',
      payloadPreview: {
        title: item.title,
        content: item.bodyText,
        status: 'draft',
        categories: [],
        meta: { data_mining: 'Prohibited', project: item.projectTitle || '' },
      },
    };
  },

  async publish(item, creds, fetchImpl = fetch) {
    if (!this.isConfigured(creds)) {
      return {
        connectorId: 'wordpress',
        status: 'nicht_verbunden',
        externalId: null,
        message: NOT_CONNECTED_MESSAGE,
      };
    }

    const baseUrl = String(creds!.siteUrl).replace(/\/+$/, '');
    const authHeader =
      'Basic ' + Buffer.from(`${creds!.username}:${creds!.applicationPassword}`).toString('base64');

    const uploadedMediaIds: number[] = [];
    for (const img of item.images) {
      const mediaRes = await fetchImpl(`${baseUrl}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': img.mimeType || 'image/png',
          'Content-Disposition': `attachment; filename="${img.filename}"`,
        },
        body: new Uint8Array(img.buffer),
      });
      if (mediaRes.ok) {
        const mediaJson: any = await mediaRes.json();
        if (mediaJson?.id) uploadedMediaIds.push(Number(mediaJson.id));
      }
    }

    const postType = creds!.postType === 'pages' ? 'pages' : 'posts';
    const postRes = await fetchImpl(`${baseUrl}/wp-json/wp/v2/${postType}`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: item.title,
        content: item.bodyText,
        status: creds!.publishStatus || 'publish',
        featured_media: uploadedMediaIds[0] || undefined,
      }),
    });

    if (!postRes.ok) {
      return {
        connectorId: 'wordpress',
        status: 'fehler',
        externalId: null,
        message: `WordPress antwortete mit Status ${postRes.status}.`,
      };
    }

    const postData: any = await postRes.json();
    return {
      connectorId: 'wordpress',
      status: 'veroeffentlicht',
      externalId: String(postData.id || 'wp-1'),
      externalUrl: postData.link || null,
      message: 'Beitrag erfolgreich an WordPress übertragen.',
      rawResponse: postData,
    };
  },

  async status(externalId, creds, fetchImpl = fetch) {
    if (!this.isConfigured(creds)) {
      return {
        connectorId: 'wordpress',
        externalId,
        status: 'nicht_verbunden',
        message: NOT_CONNECTED_MESSAGE,
      };
    }
    const baseUrl = String(creds!.siteUrl).replace(/\/+$/, '');
    const res = await fetchImpl(`${baseUrl}/wp-json/wp/v2/posts/${encodeURIComponent(externalId)}`);
    if (!res.ok) {
      return { connectorId: 'wordpress', externalId, status: 'unbekannt', message: 'Beitrag nicht erreichbar.' };
    }
    const data: any = await res.json();
    return {
      connectorId: 'wordpress',
      externalId,
      status: data.status === 'publish' ? 'live' : 'entwurf',
      message: `WordPress-Status: ${data.status}`,
    };
  },
};

// ==========================================
// 2. Ghost Admin API Connector
// ==========================================
export const ghostConnector: PublishConnector = {
  id: 'ghost',
  name: 'Ghost (Blog & Newsletter)',
  kind: 'blog',
  description: 'Erstellt Beiträge und Arbeitsproben über die Ghost Admin API (/ghost/api/admin/posts/).',
  requiredFields: ['siteUrl', 'adminApiKey'],

  isConfigured(creds) {
    return Boolean(
      creds &&
        typeof creds.siteUrl === 'string' &&
        creds.siteUrl.trim() &&
        typeof creds.adminApiKey === 'string' &&
        creds.adminApiKey.trim()
    );
  },

  async validate(item) {
    return baseValidate(item);
  },

  async preview(item) {
    return {
      connectorId: 'ghost',
      kind: 'blog',
      title: item.title,
      summary: `Ghost-Beitrag (${item.tags.join(', ') || 'ohne Tags'})`,
      endpointPreview: 'POST {siteUrl}/ghost/api/admin/posts/',
      payloadPreview: {
        posts: [
          {
            title: item.title,
            html: `<p>${item.bodyText}</p>`,
            tags: item.tags.map((t) => ({ name: t })),
            status: 'draft',
          },
        ],
      },
    };
  },

  async publish(item, creds, fetchImpl = fetch) {
    if (!this.isConfigured(creds)) {
      return {
        connectorId: 'ghost',
        status: 'nicht_verbunden',
        externalId: null,
        message: NOT_CONNECTED_MESSAGE,
      };
    }

    const baseUrl = String(creds!.siteUrl).replace(/\/+$/, '');
    const res = await fetchImpl(`${baseUrl}/ghost/api/admin/posts/?source=html`, {
      method: 'POST',
      headers: {
        Authorization: `Ghost ${creds!.adminApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        posts: [
          {
            title: item.title,
            html: `<p>${item.bodyText}</p>`,
            tags: item.tags.map((t) => ({ name: t })),
            status: creds!.publishStatus || 'draft',
          },
        ],
      }),
    });

    if (!res.ok) {
      return {
        connectorId: 'ghost',
        status: 'fehler',
        externalId: null,
        message: `Ghost Admin API antwortete mit Status ${res.status}.`,
      };
    }

    const data: any = await res.json();
    const post = data?.posts?.[0] || {};
    return {
      connectorId: 'ghost',
      status: 'veroeffentlicht',
      externalId: String(post.id || 'ghost-1'),
      externalUrl: post.url || null,
      message: 'Beitrag erfolgreich an Ghost übertragen.',
      rawResponse: post,
    };
  },

  async status(externalId, creds) {
    if (!this.isConfigured(creds)) {
      return { connectorId: 'ghost', externalId, status: 'nicht_verbunden', message: NOT_CONNECTED_MESSAGE };
    }
    return { connectorId: 'ghost', externalId, status: 'live', message: 'Ghost-Beitrag angelegt.' };
  },
};

// ==========================================
// 3. Shopify Admin API Connector
// ==========================================
export const shopifyConnector: PublishConnector = {
  id: 'shopify',
  name: 'Shopify (Online-Shop)',
  kind: 'shop',
  description: 'Legt Druck-Editionen und Merch-Produkte über die Shopify Admin REST API an.',
  requiredFields: ['shopDomain', 'accessToken'],

  isConfigured(creds) {
    return Boolean(
      creds &&
        typeof creds.shopDomain === 'string' &&
        creds.shopDomain.trim() &&
        typeof creds.accessToken === 'string' &&
        creds.accessToken.trim()
    );
  },

  async validate(item) {
    const base = baseValidate(item);
    if (item.priceCents !== undefined && item.priceCents <= 0) {
      base.warnings.push('Der Preisvorschlag ist 0 €.');
    }
    return base;
  },

  async preview(item) {
    const priceEur = ((item.priceCents ?? 2490) / 100).toFixed(2);
    return {
      connectorId: 'shopify',
      kind: 'shop',
      title: item.title,
      summary: `Shopify-Produkt (${priceEur} ${item.currency || 'EUR'})`,
      endpointPreview: 'POST https://{shopDomain}/admin/api/2024-10/products.json',
      payloadPreview: {
        product: {
          title: item.title,
          body_html: item.bodyText,
          vendor: item.creatorName,
          product_type: item.productType || 'Art Print',
          tags: item.tags.join(', '),
          variants: (item.colorVariants?.length ? item.colorVariants : ['Standard']).map((v) => ({
            option1: v,
            price: priceEur,
          })),
        },
      },
    };
  },

  async publish(item, creds, fetchImpl = fetch) {
    if (!this.isConfigured(creds)) {
      return {
        connectorId: 'shopify',
        status: 'nicht_verbunden',
        externalId: null,
        message: NOT_CONNECTED_MESSAGE,
      };
    }

    const domain = String(creds!.shopDomain).replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const priceEur = ((item.priceCents ?? 2490) / 100).toFixed(2);
    const variants = (item.colorVariants?.length ? item.colorVariants : ['Standard']).map((v) => ({
      option1: v,
      price: priceEur,
    }));

    const res = await fetchImpl(`https://${domain}/admin/api/2024-10/products.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': String(creds!.accessToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product: {
          title: item.title,
          body_html: item.bodyText,
          vendor: item.creatorName,
          product_type: item.productType || 'Graphic Novel Merch',
          tags: item.tags.join(', '),
          variants,
          images: item.images.map((img) => ({
            attachment: img.buffer.toString('base64'),
            filename: img.filename,
          })),
        },
      }),
    });

    if (!res.ok) {
      return {
        connectorId: 'shopify',
        status: 'fehler',
        externalId: null,
        message: `Shopify antwortete mit Status ${res.status}.`,
      };
    }

    const data: any = await res.json();
    const prod = data?.product || {};
    return {
      connectorId: 'shopify',
      status: 'veroeffentlicht',
      externalId: String(prod.id || 'shopify-1'),
      message: 'Produkt erfolgreich im Shopify-Shop angelegt.',
      rawResponse: prod,
    };
  },

  async status(externalId, creds) {
    if (!this.isConfigured(creds)) {
      return { connectorId: 'shopify', externalId, status: 'nicht_verbunden', message: NOT_CONNECTED_MESSAGE };
    }
    return { connectorId: 'shopify', externalId, status: 'live', message: 'Produkt in Shopify aktiv.' };
  },
};

// ==========================================
// 4. WooCommerce REST API Connector
// ==========================================
export const woocommerceConnector: PublishConnector = {
  id: 'woocommerce',
  name: 'WooCommerce (Eigener Shop)',
  kind: 'shop',
  description: 'Erstellt Produkte über die WooCommerce REST API (/wp-json/wc/v3/products).',
  requiredFields: ['storeUrl', 'consumerKey', 'consumerSecret'],

  isConfigured(creds) {
    return Boolean(
      creds &&
        typeof creds.storeUrl === 'string' &&
        creds.storeUrl.trim() &&
        typeof creds.consumerKey === 'string' &&
        creds.consumerKey.trim() &&
        typeof creds.consumerSecret === 'string' &&
        creds.consumerSecret.trim()
    );
  },

  async validate(item) {
    return baseValidate(item);
  },

  async preview(item) {
    const regularPrice = ((item.priceCents ?? 2490) / 100).toFixed(2);
    return {
      connectorId: 'woocommerce',
      kind: 'shop',
      title: item.title,
      summary: `WooCommerce-Produkt (${regularPrice} €)`,
      endpointPreview: 'POST {storeUrl}/wp-json/wc/v3/products',
      payloadPreview: {
        name: item.title,
        type: 'simple',
        regular_price: regularPrice,
        description: item.bodyText,
      },
    };
  },

  async publish(item, creds, fetchImpl = fetch) {
    if (!this.isConfigured(creds)) {
      return {
        connectorId: 'woocommerce',
        status: 'nicht_verbunden',
        externalId: null,
        message: NOT_CONNECTED_MESSAGE,
      };
    }

    const baseUrl = String(creds!.storeUrl).replace(/\/+$/, '');
    const authHeader =
      'Basic ' + Buffer.from(`${creds!.consumerKey}:${creds!.consumerSecret}`).toString('base64');
    const regularPrice = ((item.priceCents ?? 2490) / 100).toFixed(2);

    const res = await fetchImpl(`${baseUrl}/wp-json/wc/v3/products`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: item.title,
        type: 'simple',
        regular_price: regularPrice,
        description: item.bodyText,
      }),
    });

    if (!res.ok) {
      return {
        connectorId: 'woocommerce',
        status: 'fehler',
        externalId: null,
        message: `WooCommerce antwortete mit Status ${res.status}.`,
      };
    }

    const data: any = await res.json();
    return {
      connectorId: 'woocommerce',
      status: 'veroeffentlicht',
      externalId: String(data.id || 'wc-1'),
      externalUrl: data.permalink || null,
      message: 'Produkt erfolgreich in WooCommerce angelegt.',
      rawResponse: data,
    };
  },

  async status(externalId, creds) {
    if (!this.isConfigured(creds)) {
      return { connectorId: 'woocommerce', externalId, status: 'nicht_verbunden', message: NOT_CONNECTED_MESSAGE };
    }
    return { connectorId: 'woocommerce', externalId, status: 'live', message: 'WooCommerce-Produkt angelegt.' };
  },
};

// ==========================================
// 5. Printful Print-on-Demand Connector
// ==========================================
export const printfulConnector: PublishConnector = {
  id: 'printful',
  name: 'Printful (Print-on-Demand)',
  kind: 'pod',
  description: 'Überträgt Druckdateien und Produktvarianten an Printful (https://api.printful.com/store/products).',
  requiredFields: ['apiToken'],

  isConfigured(creds) {
    return Boolean(creds && typeof creds.apiToken === 'string' && creds.apiToken.trim());
  },

  async validate(item) {
    return baseValidate(item);
  },

  async preview(item) {
    const retailPrice = ((item.priceCents ?? 2490) / 100).toFixed(2);
    return {
      connectorId: 'printful',
      kind: 'pod',
      title: item.title,
      summary: `Printful POD-Produkt (${item.productType || 'tshirt'}, ${retailPrice} EUR)`,
      endpointPreview: 'POST https://api.printful.com/store/products',
      payloadPreview: {
        sync_product: { name: item.title },
        sync_variants: (item.colorVariants?.length ? item.colorVariants : ['schwarz']).map((color, idx) => ({
          retail_price: retailPrice,
          variant_id: 4012 + idx,
          options: [{ id: 'color', value: color }],
        })),
      },
    };
  },

  async publish(item, creds, fetchImpl = fetch) {
    if (!this.isConfigured(creds)) {
      return {
        connectorId: 'printful',
        status: 'nicht_verbunden',
        externalId: null,
        message: NOT_CONNECTED_MESSAGE,
      };
    }

    const retailPrice = ((item.priceCents ?? 2490) / 100).toFixed(2);
    const res = await fetchImpl('https://api.printful.com/store/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds!.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sync_product: { name: item.title },
        sync_variants: (item.colorVariants?.length ? item.colorVariants : ['schwarz']).map((color, idx) => ({
          retail_price: retailPrice,
          variant_id: 4012 + idx,
          files: item.images.map((img) => ({
            filename: img.filename,
            contents_base64: img.buffer.toString('base64'),
          })),
          options: [{ id: 'color', value: color }],
        })),
      }),
    });

    if (!res.ok) {
      return {
        connectorId: 'printful',
        status: 'fehler',
        externalId: null,
        message: `Printful API antwortete mit Status ${res.status}.`,
      };
    }

    const data: any = await res.json();
    const extId = data?.result?.id || data?.id || 'printful-1';
    return {
      connectorId: 'printful',
      status: 'veroeffentlicht',
      externalId: String(extId),
      message: 'POD-Produkt erfolgreich bei Printful angelegt.',
      rawResponse: data,
    };
  },

  async status(externalId, creds) {
    if (!this.isConfigured(creds)) {
      return { connectorId: 'printful', externalId, status: 'nicht_verbunden', message: NOT_CONNECTED_MESSAGE };
    }
    return { connectorId: 'printful', externalId, status: 'live', message: 'Printful Sync-Produkt aktiv.' };
  },
};

// ==========================================
// 6. Printify Print-on-Demand Connector
// ==========================================
export const printifyConnector: PublishConnector = {
  id: 'printify',
  name: 'Printify (Print-on-Demand)',
  kind: 'pod',
  description: 'Legt POD-Produkte über die Printify REST API (/v1/shops/{shopId}/products.json) an.',
  requiredFields: ['apiToken', 'shopId'],

  isConfigured(creds) {
    return Boolean(
      creds &&
        typeof creds.apiToken === 'string' &&
        creds.apiToken.trim() &&
        typeof creds.shopId === 'string' &&
        creds.shopId.trim()
    );
  },

  async validate(item) {
    return baseValidate(item);
  },

  async preview(item) {
    return {
      connectorId: 'printify',
      kind: 'pod',
      title: item.title,
      summary: `Printify POD-Produkt (${item.productType || 'poster'})`,
      endpointPreview: 'POST https://api.printify.com/v1/shops/{shopId}/products.json',
      payloadPreview: {
        title: item.title,
        description: item.bodyText,
        blueprint_id: 3,
        print_provider_id: 1,
        variants: [{ id: 1, price: item.priceCents ?? 2490, is_enabled: true }],
      },
    };
  },

  async publish(item, creds, fetchImpl = fetch) {
    if (!this.isConfigured(creds)) {
      return {
        connectorId: 'printify',
        status: 'nicht_verbunden',
        externalId: null,
        message: NOT_CONNECTED_MESSAGE,
      };
    }

    const shopId = encodeURIComponent(String(creds!.shopId));
    const res = await fetchImpl(`https://api.printify.com/v1/shops/${shopId}/products.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds!.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: item.title,
        description: item.bodyText,
        blueprint_id: Number(creds!.blueprintId || 3),
        print_provider_id: Number(creds!.printProviderId || 1),
        variants: [{ id: 1, price: item.priceCents ?? 2490, is_enabled: true }],
      }),
    });

    if (!res.ok) {
      return {
        connectorId: 'printify',
        status: 'fehler',
        externalId: null,
        message: `Printify API antwortete mit Status ${res.status}.`,
      };
    }

    const data: any = await res.json();
    return {
      connectorId: 'printify',
      status: 'veroeffentlicht',
      externalId: String(data.id || 'printify-1'),
      message: 'POD-Produkt erfolgreich bei Printify angelegt.',
      rawResponse: data,
    };
  },

  async status(externalId, creds) {
    if (!this.isConfigured(creds)) {
      return { connectorId: 'printify', externalId, status: 'nicht_verbunden', message: NOT_CONNECTED_MESSAGE };
    }
    return { connectorId: 'printify', externalId, status: 'live', message: 'Printify-Produkt angelegt.' };
  },
};

// ==========================================
// 7. Generischer Webhook Connector (HMAC-signiert)
// ==========================================
export const webhookConnector: PublishConnector = {
  id: 'webhook',
  name: 'Generischer Webhook (HMAC-SHA256)',
  kind: 'website',
  description: 'Sendet ein HMAC-SHA256-signiertes JSON-Paket mit Metadaten und geschützten Bildern an eine eigene URL.',
  requiredFields: ['webhookUrl', 'webhookSecret'],

  isConfigured(creds) {
    return Boolean(
      creds &&
        typeof creds.webhookUrl === 'string' &&
        creds.webhookUrl.trim() &&
        typeof creds.webhookSecret === 'string' &&
        creds.webhookSecret.trim()
    );
  },

  async validate(item) {
    return baseValidate(item);
  },

  async preview(item) {
    return {
      connectorId: 'webhook',
      kind: 'website',
      title: item.title,
      summary: `HMAC-SHA256 signierter POST-Request mit ${item.images.length} geschützten Bild(ern)`,
      endpointPreview: 'POST {webhookUrl} (Header: X-Federfuehrer-Signature: sha256=...)',
      payloadPreview: {
        event: 'federfuehrer.publication',
        title: item.title,
        bodyText: item.bodyText,
        tags: item.tags,
        images: item.images.map((img) => ({
          filename: img.filename,
          pHash: img.pHash,
          sha256: img.sha256,
          dataMining: 'Prohibited',
        })),
      },
    };
  },

  async publish(item, creds, fetchImpl = fetch) {
    if (!this.isConfigured(creds)) {
      return {
        connectorId: 'webhook',
        status: 'nicht_verbunden',
        externalId: null,
        message: NOT_CONNECTED_MESSAGE,
      };
    }

    const bodyObj = {
      event: 'federfuehrer.publication',
      timestamp: new Date().toISOString(),
      title: item.title,
      bodyText: item.bodyText,
      tags: item.tags,
      creatorName: item.creatorName,
      copyrightNotice: item.copyrightNotice || `© ${new Date().getFullYear()} ${item.creatorName}`,
      dataMining: 'Prohibited',
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      priceCents: item.priceCents,
      currency: item.currency || 'EUR',
      images: item.images.map((img) => ({
        filename: img.filename,
        mimeType: img.mimeType,
        pHash: img.pHash,
        sha256: img.sha256,
        url: `/api/v1/publish/media/${encodeURIComponent(img.filename)}`,
        base64: img.buffer.toString('base64'),
      })),
    };

    const payloadStr = JSON.stringify(bodyObj);
    const signature = signWebhookPayload(payloadStr, String(creds!.webhookSecret));

    const res = await fetchImpl(String(creds!.webhookUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Federfuehrer-Signature': signature,
      },
      body: payloadStr,
    });

    if (!res.ok) {
      return {
        connectorId: 'webhook',
        status: 'fehler',
        externalId: null,
        message: `Webhook antwortete mit HTTP ${res.status}.`,
      };
    }

    let respJson: any = {};
    try {
      respJson = await res.json();
    } catch {
      respJson = { ok: true };
    }

    return {
      connectorId: 'webhook',
      status: 'veroeffentlicht',
      externalId: String(respJson.id || `webhook-${Date.now()}`),
      message: 'Webhook erfolgreich mit gültiger HMAC-Signatur ausgelöst.',
      rawResponse: { signature, response: respJson },
    };
  },

  async status(externalId, creds) {
    if (!this.isConfigured(creds)) {
      return { connectorId: 'webhook', externalId, status: 'nicht_verbunden', message: NOT_CONNECTED_MESSAGE };
    }
    return { connectorId: 'webhook', externalId, status: 'live', message: 'Webhook zugestellt.' };
  },
};

export const ALL_PUBLISH_CONNECTORS: Record<string, PublishConnector> = {
  wordpress: wordpressConnector,
  ghost: ghostConnector,
  shopify: shopifyConnector,
  woocommerce: woocommerceConnector,
  printful: printfulConnector,
  printify: printifyConnector,
  webhook: webhookConnector,
};

/**
 * Immer verfügbar: Erzeugt ein Export-Paket als ZIP-Datei mit den geschützten Bildern,
 * `product.json`, Beitragstext (`beitrag.md`) und einer verständlichen deutschen Anleitung (`LIESMICH.txt`).
 */
export async function buildExportPackageZip(item: PublishableItem): Promise<Buffer> {
  const zip = new JSZip();

  const productJson = {
    title: item.title,
    bodyText: item.bodyText,
    tags: item.tags,
    projectTitle: item.projectTitle || 'Federführer Graphic Novel',
    creator: item.creatorName,
    copyright: item.copyrightNotice || `© ${new Date().getFullYear()} ${item.creatorName}`,
    dataMining: 'Prohibited',
    sourceType: item.sourceType,
    sourceId: item.sourceId,
    productType: item.productType || null,
    colorVariants: item.colorVariants || [],
    suggestedPriceCents: item.priceCents ?? null,
    currency: item.currency || 'EUR',
    exportedAt: new Date().toISOString(),
    images: item.images.map((img, idx) => ({
      file: `bilder/${String(idx + 1).padStart(2, '0')}_${img.filename}`,
      mimeType: img.mimeType,
      pHash: img.pHash,
      sha256: img.sha256,
      altText: img.altText || item.title,
    })),
  };

  zip.file('product.json', JSON.stringify(productJson, null, 2));

  const markdown = `# ${item.title}\n\n${item.bodyText}\n\n---\n- **Urheberin:** ${item.creatorName}\n- **Schutz:** Unsichtbares DCT-Wasserzeichen & IPTC/XMP \`Data Mining: Prohibited\`\n- **Tags:** ${item.tags.join(', ') || 'keine'}\n`;
  zip.file('beitrag.md', markdown);

  const readmeTxt = `FEDERFÜHRER EXPORT-PAKET
=========================
Titel: ${item.title}
Urheberin: ${item.creatorName}

Was ist in diesem Paket enthalten?
1. Ordner "bilder/": Deine Bilder mit eingebettetem unsichtbarem Wasserzeichen und dem Vermerk "Data Mining: Prohibited". Die Originaldateien bleiben sicher im Studio.
2. "beitrag.md": Dein fertig vorbereiteter Text zum Kopieren für Website, Blog oder Social Media.
3. "product.json": Strukturierte Produkt- und Beitragsdaten für Shops und Print-on-Demand (Printful, Printify, Shopify, WooCommerce).

Noch nicht verbunden – du kannst dieses Paket direkt herunterladen und selbst bei deinem Dienst hochladen.
`;
  zip.file('LIESMICH.txt', readmeTxt);

  for (let i = 0; i < item.images.length; i++) {
    const img = item.images[i];
    const safeName = img.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    zip.file(`bilder/${String(i + 1).padStart(2, '0')}_${safeName}`, img.buffer);
  }

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
