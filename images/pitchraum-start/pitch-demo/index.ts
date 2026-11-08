export { PITCH_PRODUCT_NAME, RIGHTS_STATUS_LABEL } from './types';
export type {
  PitchDemoViewId,
  ComposerSectionId,
  SplitEntry,
  ContractDocumentEntry,
  TrackRightsFile,
  PitchTrack,
  PitchLinkRecord,
  PipelineStage,
  LicenseInquiryRecord,
  PitchDemoState,
} from './types';

export {
  getPitchDemoState,
  resetPitchDemoState,
  getTrackMissingReasons,
  createPitchLink,
  markPitchLinkOpened,
  markPitchLinkListened,
  createLicenseInquiry,
  updateInquiryPipelineStage,
  updateTrackRightsMetadata,
  addSplitToTrackRights,
  addContractToTrackRights,
} from './mockApi';

export { DemoControlBar } from './DemoControlBar';
export { ComposerHomeView } from './ComposerHomeView';
export { SendMusicWizard } from './SendMusicWizard';
export { MyMusicView } from './MyMusicView';
export { InquiriesView } from './InquiriesView';
export { RecipientPitchView } from './RecipientPitchView';
export { PitchRoomDemo } from './PitchRoomDemo';
