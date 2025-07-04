import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useTranslation } from 'react-i18next';
import { 
  FiEdit3, 
  FiEye, 
  FiEyeOff, 
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

const HomepageSections = () => {
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

  // Handle drag and drop reordering
  const handleOnDragEnd = async (result) => {
    if (!result.destination) return;

    const reorderedSections = Array.from(sections);
    const [removed] = reorderedSections.splice(result.source.index, 1);
    reorderedSections.splice(result.destination.index, 0, removed);

    // Update local state immediately for better UX
    setSections(reorderedSections);

    try {
      // Update sort order on backend
      await HomepageSectionServices.updateSectionsOrder({
        sections: reorderedSections.map((section, index) => ({
          sectionId: section.sectionId,
          sortOrder: index
        }))
      });
      notifySuccess('Sections order updated successfully!');
    } catch (error) {
      console.error('Error updating order:', error);
      notifyError('Failed to update sections order');
      // Revert local state if API call fails
      fetchSections();
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
          <p className="text-gray-600">Manage the sections displayed on your homepage. Drag and drop to reorder, toggle visibility, and edit content.</p>
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
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <Droppable droppableId="sections">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {sections.map((section, index) => (
                  <Draggable key={section.sectionId} draggableId={section.sectionId} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white rounded-lg shadow-md border ${
                          snapshot.isDragging ? 'shadow-lg border-emerald-300' : 'border-gray-200'
                        }`}
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-move text-gray-400 hover:text-gray-600"
                              >
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
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
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

              {/* Content Settings based on section type */}
              {editingSection.sectionId === 'why_choose_us' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Why Choose Us Content</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title (English)
                      </label>
                      <InputAreaTwo
                        value={editingSection.content?.title?.en || ''}
                        onChange={(e) => updateEditingSection('content.title', e.target.value, 'en')}
                        placeholder="Why Choose SAPT Markets?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title (Arabic)
                      </label>
                      <InputAreaTwo
                        value={editingSection.content?.title?.ar || ''}
                        onChange={(e) => updateEditingSection('content.title', e.target.value, 'ar')}
                        placeholder="لماذا تختار أسواق سابت؟"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subtitle (English)
                      </label>
                      <InputAreaTwo
                        value={editingSection.content?.subtitle?.en || ''}
                        onChange={(e) => updateEditingSection('content.subtitle', e.target.value, 'en')}
                        placeholder="Saudi Arabia's Leading Online Supermarket"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subtitle (Arabic)
                      </label>
                      <InputAreaTwo
                        value={editingSection.content?.subtitle?.ar || ''}
                        onChange={(e) => updateEditingSection('content.subtitle', e.target.value, 'ar')}
                        placeholder="السوبرماركت الإلكتروني الرائد في المملكة العربية السعودية"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (English)
                      </label>
                      <TextAreaCom
                        value={editingSection.content?.description?.en || ''}
                        onChange={(e) => updateEditingSection('content.description', e.target.value, 'en')}
                        placeholder="Discover thousands of premium products..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Arabic)
                      </label>
                      <TextAreaCom
                        value={editingSection.content?.description?.ar || ''}
                        onChange={(e) => updateEditingSection('content.description', e.target.value, 'ar')}
                        placeholder="اكتشف آلاف المنتجات المتميزة..."
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Statistics</h4>
                    <div className="space-y-4">
                      {(editingSection.content?.stats || []).map((stat, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h5 className="font-medium text-gray-700">Stat {index + 1}</h5>
                            <button
                              type="button"
                              onClick={() => {
                                const newStats = [...(editingSection.content?.stats || [])];
                                newStats.splice(index, 1);
                                updateEditingSection('content.stats', newStats);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Value
                              </label>
                              <InputAreaTwo
                                value={stat.value || ''}
                                onChange={(e) => {
                                  const newStats = [...(editingSection.content?.stats || [])];
                                  newStats[index] = { ...newStats[index], value: e.target.value };
                                  updateEditingSection('content.stats', newStats);
                                }}
                                placeholder="Thousands of"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Label
                              </label>
                              <InputAreaTwo
                                value={stat.label || ''}
                                onChange={(e) => {
                                  const newStats = [...(editingSection.content?.stats || [])];
                                  newStats[index] = { ...newStats[index], label: e.target.value };
                                  updateEditingSection('content.stats', newStats);
                                }}
                                placeholder="Satisfied Customers"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const newStats = [...(editingSection.content?.stats || []), { value: '', label: '' }];
                          updateEditingSection('content.stats', newStats);
                        }}
                        className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
                      >
                        + Add Stat
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {(editingSection.sectionId === 'categories' || 
                editingSection.sectionId === 'special_prices' ||
                editingSection.sectionId === 'combo_deals' ||
                editingSection.sectionId === 'featured_products' ||
                editingSection.sectionId === 'popular_products' ||
                editingSection.sectionId === 'discount_products') && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Section Content</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title (English)
                      </label>
                      <InputAreaTwo
                        value={editingSection.content?.title?.en || ''}
                        onChange={(e) => updateEditingSection('content.title', e.target.value, 'en')}
                        placeholder="Section Title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title (Arabic)
                      </label>
                      <InputAreaTwo
                        value={editingSection.content?.title?.ar || ''}
                        onChange={(e) => updateEditingSection('content.title', e.target.value, 'ar')}
                        placeholder="عنوان القسم"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (English)
                      </label>
                      <TextAreaCom
                        value={editingSection.content?.description?.en || ''}
                        onChange={(e) => updateEditingSection('content.description', e.target.value, 'en')}
                        placeholder="Section description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Arabic)
                      </label>
                      <TextAreaCom
                        value={editingSection.content?.description?.ar || ''}
                        onChange={(e) => updateEditingSection('content.description', e.target.value, 'ar')}
                        placeholder="وصف القسم"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Settings for product sections */}
                  {(editingSection.sectionId.includes('products') || 
                    editingSection.sectionId === 'special_prices' ||
                    editingSection.sectionId === 'combo_deals') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {editingSection.settings?.maxItems !== undefined && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Items
                          </label>
                          <InputAreaTwo
                            type="number"
                            value={editingSection.settings?.maxItems || ''}
                            onChange={(e) => updateEditingSection('settings.maxItems', parseInt(e.target.value))}
                            placeholder="8"
                          />
                        </div>
                      )}
                      
                      {editingSection.settings?.cardVariant !== undefined && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Variant
                          </label>
                          <select
                            value={editingSection.settings?.cardVariant || 'simple'}
                            onChange={(e) => updateEditingSection('settings.cardVariant', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="simple">Simple</option>
                            <option value="advanced">Advanced</option>
                            <option value="modern">Modern</option>
                          </select>
                        </div>
                      )}

                      {editingSection.settings?.gridCols !== undefined && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Grid Columns
                          </label>
                          <select
                            value={editingSection.settings?.gridCols || 'lg:grid-cols-3'}
                            onChange={(e) => updateEditingSection('settings.gridCols', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="lg:grid-cols-2">2 Columns</option>
                            <option value="lg:grid-cols-3">3 Columns</option>
                            <option value="lg:grid-cols-4">4 Columns</option>
                            <option value="lg:grid-cols-5">5 Columns</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Trust Features Section */}
              {editingSection.sectionId === 'trust_features' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Trust Features Content</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title (English)
                      </label>
                      <InputAreaTwo
                        value={editingSection.content?.title?.en || ''}
                        onChange={(e) => updateEditingSection('content.title', e.target.value, 'en')}
                        placeholder="The SAPT Markets Advantage"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title (Arabic)
                      </label>
                      <InputAreaTwo
                        value={editingSection.content?.title?.ar || ''}
                        onChange={(e) => updateEditingSection('content.title', e.target.value, 'ar')}
                        placeholder="مميزات أسواق سابت"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (English)
                      </label>
                      <TextAreaCom
                        value={editingSection.content?.description?.en || ''}
                        onChange={(e) => updateEditingSection('content.description', e.target.value, 'en')}
                        placeholder="Experience the difference with our premium service standards"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Arabic)
                      </label>
                      <TextAreaCom
                        value={editingSection.content?.description?.ar || ''}
                        onChange={(e) => updateEditingSection('content.description', e.target.value, 'ar')}
                        placeholder="اختبر الفرق مع معايير خدمتنا المتميزة"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Features Section */}
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Features</h4>
                    <div className="space-y-4">
                      {(editingSection.content?.features || []).map((feature, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h5 className="font-medium text-gray-700">Feature {index + 1}</h5>
                            <button
                              type="button"
                              onClick={() => {
                                const newFeatures = [...(editingSection.content?.features || [])];
                                newFeatures.splice(index, 1);
                                updateEditingSection('content.features', newFeatures);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Title (English)
                                </label>
                                <InputAreaTwo
                                  value={feature.title?.en || ''}
                                  onChange={(e) => {
                                    const newFeatures = [...(editingSection.content?.features || [])];
                                    newFeatures[index] = { 
                                      ...newFeatures[index], 
                                      title: { ...newFeatures[index]?.title, en: e.target.value }
                                    };
                                    updateEditingSection('content.features', newFeatures);
                                  }}
                                  placeholder="Free Same-Day Delivery"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Title (Arabic)
                                </label>
                                <InputAreaTwo
                                  value={feature.title?.ar || ''}
                                  onChange={(e) => {
                                    const newFeatures = [...(editingSection.content?.features || [])];
                                    newFeatures[index] = { 
                                      ...newFeatures[index], 
                                      title: { ...newFeatures[index]?.title, ar: e.target.value }
                                    };
                                    updateEditingSection('content.features', newFeatures);
                                  }}
                                  placeholder="توصيل مجاني في نفس اليوم"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Description (English)
                                </label>
                                <TextAreaCom
                                  value={feature.description?.en || ''}
                                  onChange={(e) => {
                                    const newFeatures = [...(editingSection.content?.features || [])];
                                    newFeatures[index] = { 
                                      ...newFeatures[index], 
                                      description: { ...newFeatures[index]?.description, en: e.target.value }
                                    };
                                    updateEditingSection('content.features', newFeatures);
                                  }}
                                  placeholder="Order by 2 PM for same-day delivery — no minimum purchase required"
                                  rows={2}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Description (Arabic)
                                </label>
                                <TextAreaCom
                                  value={feature.description?.ar || ''}
                                  onChange={(e) => {
                                    const newFeatures = [...(editingSection.content?.features || [])];
                                    newFeatures[index] = { 
                                      ...newFeatures[index], 
                                      description: { ...newFeatures[index]?.description, ar: e.target.value }
                                    };
                                    updateEditingSection('content.features', newFeatures);
                                  }}
                                  placeholder="اطلب قبل الساعة 2 ظهراً للحصول على التوصيل في نفس اليوم - لا يوجد حد أدنى للشراء"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const newFeatures = [...(editingSection.content?.features || []), { 
                            title: { en: '', ar: '' }, 
                            description: { en: '', ar: '' } 
                          }];
                          updateEditingSection('content.features', newFeatures);
                        }}
                        className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
                      >
                        + Add Feature
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Newsletter Section */}
              {editingSection.sectionId === 'newsletter' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Newsletter Content</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title (English)
                      </label>
                      <InputAreaTwo
                        value={editingSection.content?.title?.en || ''}
                        onChange={(e) => updateEditingSection('content.title', e.target.value, 'en')}
                        placeholder="Stay Updated"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title (Arabic)
                      </label>
                      <InputAreaTwo
                        value={editingSection.content?.title?.ar || ''}
                        onChange={(e) => updateEditingSection('content.title', e.target.value, 'ar')}
                        placeholder="ابق على اطلاع"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (English)
                      </label>
                      <TextAreaCom
                        value={editingSection.content?.description?.en || ''}
                        onChange={(e) => updateEditingSection('content.description', e.target.value, 'en')}
                        placeholder="Subscribe to our newsletter for the latest offers and updates"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Arabic)
                      </label>
                      <TextAreaCom
                        value={editingSection.content?.description?.ar || ''}
                        onChange={(e) => updateEditingSection('content.description', e.target.value, 'ar')}
                        placeholder="اشترك في نشرتنا الإخبارية للحصول على أحدث العروض والتحديثات"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Button Text (English)
                      </label>
                      <InputAreaTwo
                        value={editingSection.content?.buttonText?.en || ''}
                        onChange={(e) => updateEditingSection('content.buttonText', e.target.value, 'en')}
                        placeholder="Subscribe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Button Text (Arabic)
                      </label>
                      <InputAreaTwo
                        value={editingSection.content?.buttonText?.ar || ''}
                        onChange={(e) => updateEditingSection('content.buttonText', e.target.value, 'ar')}
                        placeholder="اشترك"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Placeholder Text (English)
                      </label>
                      <InputAreaTwo
                        value={editingSection.content?.placeholderText?.en || ''}
                        onChange={(e) => updateEditingSection('content.placeholderText', e.target.value, 'en')}
                        placeholder="Enter your email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Placeholder Text (Arabic)
                      </label>
                      <InputAreaTwo
                        value={editingSection.content?.placeholderText?.ar || ''}
                        onChange={(e) => updateEditingSection('content.placeholderText', e.target.value, 'ar')}
                        placeholder="أدخل عنوان بريدك الإلكتروني"
                      />
                    </div>
                  </div>

                  {/* Benefits Section */}
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Benefits</h4>
                    <div className="space-y-4">
                      {(editingSection.content?.benefits || []).map((benefit, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h5 className="font-medium text-gray-700">Benefit {index + 1}</h5>
                            <button
                              type="button"
                              onClick={() => {
                                const newBenefits = [...(editingSection.content?.benefits || [])];
                                newBenefits.splice(index, 1);
                                updateEditingSection('content.benefits', newBenefits);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Text (English)
                              </label>
                              <InputAreaTwo
                                value={benefit.text?.en || ''}
                                onChange={(e) => {
                                  const newBenefits = [...(editingSection.content?.benefits || [])];
                                  newBenefits[index] = { 
                                    ...newBenefits[index], 
                                    text: { ...newBenefits[index]?.text, en: e.target.value }
                                  };
                                  updateEditingSection('content.benefits', newBenefits);
                                }}
                                placeholder="Weekly exclusive discount codes"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Text (Arabic)
                              </label>
                              <InputAreaTwo
                                value={benefit.text?.ar || ''}
                                onChange={(e) => {
                                  const newBenefits = [...(editingSection.content?.benefits || [])];
                                  newBenefits[index] = { 
                                    ...newBenefits[index], 
                                    text: { ...newBenefits[index]?.text, ar: e.target.value }
                                  };
                                  updateEditingSection('content.benefits', newBenefits);
                                }}
                                placeholder="رموز خصم حصرية أسبوعية"
                              />
                            </div>
                          </div>
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Icon Type
                            </label>
                            <select
                              value={benefit.iconType || 'tag'}
                              onChange={(e) => {
                                const newBenefits = [...(editingSection.content?.benefits || [])];
                                newBenefits[index] = { ...newBenefits[index], iconType: e.target.value };
                                updateEditingSection('content.benefits', newBenefits);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="tag">Tag (Discount)</option>
                              <option value="clock">Clock (Time)</option>
                              <option value="bell">Bell (Notifications)</option>
                              <option value="user">User (Personal)</option>
                            </select>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const newBenefits = [...(editingSection.content?.benefits || []), { 
                            text: { en: '', ar: '' }, 
                            iconType: 'tag' 
                          }];
                          updateEditingSection('content.benefits', newBenefits);
                        }}
                        className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
                      >
                        + Add Benefit
                      </button>
                    </div>
                  </div>
                </div>
              )}

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

export default HomepageSections; 