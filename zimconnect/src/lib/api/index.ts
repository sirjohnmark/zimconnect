export { api, ApiError, NetworkError } from "./client";
export type { RequestOptions } from "./client";

export {
  getCategories,
  getCategoryTree,
  getCategory,
} from "./categories";
export type { GetCategoriesParams, PaginatedCategories } from "./categories";

export {
  getListings,
  getListing,
  getListingBySlug,
  getMyListings,
  createListing,
  publishListing,
  deleteListing,
  uploadImages,
  getAllListingsAdmin,
  approveListing,
  rejectListing,
  featureListing,
} from "./listings";
export type {
  GetListingsParams,
  PaginatedListings,
  CreateListingPayload,
  CreateListingBody,
  CreateListingInput,
  AdminListingsParams,
} from "./listings";

export {
  getConversations,
  getConversation,
  startConversation,
  sendMessage,
  markMessageRead,
  getUnreadCount,
} from "./inbox";
export type {
  Conversation,
  Message,
  ConversationParticipant,
  PaginatedConversations,
  StartConversationBody,
} from "./inbox";

export {
  getBuyerDashboard,
  getSavedListings,
  saveListing,
  unsaveListing,
  isSavedRemote,
} from "./buyers";
export type {
  BuyerDashboard,
  SellerApplicationSummary,
  SavedListing,
  SavedListingDetail,
} from "./buyers";

export {
  getPublicSellerProfile,
  getMySellerProfile,
  updateMySellerProfile,
  applyToSell,
  getSellerApplicationStatus,
  getSellerDashboard,
  getSellerListings,
  getAdminSellerRequests,
  approveSellerRequest,
  rejectSellerRequest,
} from "./sellers";
export type {
  SellerProfile,
  SellerProfileUpdate,
  SellerApplication,
  SellerDashboard,
  SellerDashboardListingPreview,
  AdminSellerRequest,
} from "./sellers";
