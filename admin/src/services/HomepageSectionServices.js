import requests from "./httpService";

const HomepageSectionServices = {
  // Get all homepage sections for admin
  getAllSections: async () => {
    return requests.get("/homepage-sections/admin/all");
  },

  // Get active homepage sections (public)
  getActiveSections: async () => {
    return requests.get("/homepage-sections/active");
  },

  // Get single homepage section
  getSection: async (sectionId) => {
    return requests.get(`/homepage-sections/${sectionId}`);
  },

  // Update homepage section
  updateSection: async (sectionId, data) => {
    return requests.put(`/homepage-sections/${sectionId}`, data);
  },

  // Update sections order
  updateSectionsOrder: async (data) => {
    return requests.put("/homepage-sections/order/update", data);
  },

  // Toggle section visibility
  toggleSectionVisibility: async (sectionId, isActive) => {
    return requests.put(`/homepage-sections/${sectionId}/toggle`, { isActive });
  },

  // Initialize default sections
  initializeDefaultSections: async () => {
    return requests.post("/homepage-sections/initialize");
  },
};

export default HomepageSectionServices; 