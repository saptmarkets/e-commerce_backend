import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FiEdit3, 
  FiMove,
  FiSettings,
  FiSave,
  FiX
} from 'react-icons/fi';
import { Button } from '@windmill/react-ui';

import SwitchToggle from '@/components/form/switch/SwitchToggle';
import InputAreaTwo from '@/components/form/input/InputAreaTwo';
import TextAreaCom from '@/components/form/others/TextAreaCom';
import HomepageSectionServices from '@/services/HomepageSectionServices';
import { notifyError, notifySuccess } from '@/utils/toast';

const HomepageSectionsSimple = () => {
  const { t } = useTranslation();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch sections on component mount
  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await HomepageSectionServices.getAllSections();
      setSections(response || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      notifyError('Failed to fetch homepage sections');
    } finally {
      setLoading(false);
    }
  };

  // Toggle section visibility
  const toggleSectionVisibility = async (sectionId, currentStatus) => {
    try {
      await HomepageSectionServices.toggleSectionVisibility(sectionId, !currentStatus);
      setSections(sections.map(section => 
        section.sectionId === sectionId 
          ? { ...section, isActive: !currentStatus }
          : section
      ));
      notifySuccess(`Section ${!currentStatus ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('Error toggling visibility:', error);
      notifyError('Failed to update section visibility');
    }
  };

  // Start editing a section
  const startEditing = (section) => {
    setEditingSection({ ...section });
  };

  // Save section changes
  const saveSection = async () => {
    if (!editingSection) return;

    try {
      setIsSubmitting(true);
      await HomepageSectionServices.updateSection(editingSection.sectionId, editingSection);
      
      setSections(sections.map(section => 
        section.sectionId === editingSection.sectionId 
          ? editingSection 
          : section
      ));
      
      setEditingSection(null);
      notifySuccess('Section updated successfully!');
    } catch (error) {
      console.error('Error updating section:', error);
      notifyError('Failed to update section');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingSection(null);
  };

  // Update editing section content
  const updateEditingSection = (field, value, language = null) => {
    if (!editingSection) return;

    setEditingSection(prev => {
      const updated = { ...prev };
      
      if (language) {
        // Handle multilingual fields
        if (!updated.content) updated.content = {};
        if (!updated.content[field]) updated.content[field] = {};
        updated.content[field][language] = value;
      } else if (field.includes('.')) {
        // Handle nested fields
        const keys = field.split('.');
        let current = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
      } else {
        // Handle simple fields
        updated[field] = value;
      }
      
      return updated;
    });
  };

  // Initialize default sections if none exist
  const initializeDefaultSections = async () => {
    try {
      setLoading(true);
      await HomepageSectionServices.initializeDefaultSections();
      await fetchSections();
      notifySuccess('Default sections initialized successfully!');
    } catch (error) {
      console.error('Error initializing sections:', error);
      notifyError('Failed to initialize default sections');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Homepage Sections Management</h1>
          <p className="text-gray-600">Manage the sections displayed on your homepage. Toggle visibility and edit content.</p>
        </div>
        {sections.length === 0 && (
          <Button onClick={initializeDefaultSections} className="bg-emerald-600 hover:bg-emerald-700">
            Initialize Default Sections
          </Button>
        )}
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-20">
          <FiSettings className="mx-auto text-6xl text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Sections Found</h3>
          <p className="text-gray-500 mb-6">Initialize default sections to get started with homepage customization.</p>
          <Button onClick={initializeDefaultSections} className="bg-emerald-600 hover:bg-emerald-700">
            Initialize Default Sections
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sections
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((section, index) => (
              <div
                key={section.sectionId}
                className="bg-white rounded-lg shadow-md border border-gray-200"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-gray-400">
                        <FiMove size={20} />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-800">
                          {section.name?.en || section.sectionId}
                        </h3>
                        <p className="text-gray-600 text-sm">{section.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <SwitchToggle
                        title=""
                        handleProcess={() => toggleSectionVisibility(section.sectionId, section.isActive)}
                        processOption={section.isActive}
                      />
                      
                      <Button
                        onClick={() => startEditing(section)}
                        className="bg-blue-600 hover:bg-blue-700 p-2"
                        size="small"
                      >
                        <FiEdit3 size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Section Preview */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          section.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {section.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Order:</span>
                        <span className="ml-2">{section.sortOrder + 1}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <span className="ml-2 capitalize">{section.sectionId.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Edit Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Edit Section: {editingSection.name?.en || editingSection.sectionId}
              </h2>
              <div className="flex space-x-2">
                <Button
                  onClick={saveSection}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <FiSave className="mr-2" />
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={cancelEditing}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  <FiX className="mr-2" />
                  Cancel
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Name (English)
                  </label>
                  <InputAreaTwo
                    value={editingSection.name?.en || ''}
                    onChange={(e) => updateEditingSection('name', e.target.value, 'en')}
                    placeholder="Enter section name in English"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Name (Arabic)
                  </label>
                  <InputAreaTwo
                    value={editingSection.name?.ar || ''}
                    onChange={(e) => updateEditingSection('name', e.target.value, 'ar')}
                    placeholder="Enter section name in Arabic"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <TextAreaCom
                  value={editingSection.description || ''}
                  onChange={(e) => updateEditingSection('description', e.target.value)}
                  placeholder="Enter section description"
                  rows={3}
                />
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">Section Status</h4>
                  <p className="text-sm text-gray-600">Enable or disable this section on the homepage</p>
                </div>
                <SwitchToggle
                  title=""
                  handleProcess={() => updateEditingSection('isActive', !editingSection.isActive)}
                  processOption={editingSection.isActive}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomepageSectionsSimple; 