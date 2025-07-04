import requests from "./httpServices";

const HomepageSectionServices = {
  // Get active homepage sections for customer app
  getActiveSections: async () => {
    return requests.get("/homepage-sections/active");
  },

  // Get single homepage section
  getSection: async (sectionId) => {
    return requests.get(`/homepage-sections/${sectionId}`);
  },
};

export default HomepageSectionServices; 