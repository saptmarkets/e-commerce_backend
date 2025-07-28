import { useQuery } from "@tanstack/react-query";
import HomepageSectionServices from "@services/HomepageSectionServices";

const useHomepageSections = () => {
  const {
    data: rawSections,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["homepage-sections"],
    queryFn: async () => {
      try {
        return await HomepageSectionServices.getActiveSections();
      } catch (error) {
        // If API endpoint doesn't exist, return empty array instead of throwing
        if (error?.response?.status === 404) {
          console.warn('Homepage sections API endpoint not found, returning empty sections');
          return [];
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Remove duplicates and ensure unique sections
  const sections = rawSections ? 
    rawSections.filter((section, index, self) => 
      index === self.findIndex(s => s.sectionId === section.sectionId)
    ) : [];

  // Helper function to get section by ID
  const getSection = (sectionId) => {
    return sections?.find(section => section.sectionId === sectionId);
  };

  // Helper function to check if section is active
  const isSectionActive = (sectionId) => {
    const section = getSection(sectionId);
    return section?.isActive || false;
  };

  // Helper function to get section content
  const getSectionContent = (sectionId, field, language = 'en') => {
    const section = getSection(sectionId);
    if (!section?.content) return '';
    
    if (section.content[field] && typeof section.content[field] === 'object') {
      const val = section.content[field][language] || section.content[field]['en'] || '';
      // If we accidentally received an object instead of string (e.g. char map), flatten it
      if (typeof val === 'object') {
        return Object.values(val).join('');
      }
      return val;
    }
    
    const plainVal = section.content[field] || '';
    return typeof plainVal === 'object' ? Object.values(plainVal).join('') : plainVal;
  };

  // Helper function to get section settings
  const getSectionSettings = (sectionId, setting = null) => {
    const section = getSection(sectionId);
    if (!section?.settings) return setting ? null : {};
    
    return setting ? section.settings[setting] : section.settings;
  };

  return {
    sections: sections || [],
    isLoading,
    error,
    refetch,
    getSection,
    isSectionActive,
    getSectionContent,
    getSectionSettings
  };
};

export default useHomepageSections; 