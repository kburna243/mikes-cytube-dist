"use client";

import dynamic from "next/dynamic";

// Client only: the Werkstatt reads the saved draft from localStorage on its first render.
const WerkstattClient = dynamic(() => import("./Werkstatt"), { ssr: false });

export default WerkstattClient;
