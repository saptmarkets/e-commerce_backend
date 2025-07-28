import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import UploaderWithCropper from "@/components/image-uploader/UploaderWithCropper";

// Import all the original tab components
import StoreTabList from "@/components/store-home/StoreTabList";
import HomePage from "@/components/store-home/HomePage";
import SinglePage from "@/components/store-home/SinglePage";
import AboutUs from "@/components/store-home/AboutUs";
import PrivacyPolicy from "@/components/store-home/PrivacyPolicy";
import Faq from "@/components/store-home/Faq";
import Offer from "@/components/store-home/Offer";
import ContactUs from "@/components/store-home/ContactUs";
import DistanceBasedShipping from "@/components/store-home/DistanceBasedShipping";

// Import the hook for store home functionality
import useStoreHomeSubmit from "@/hooks/useStoreHomeSubmit";

// Homepage Sections Component (our new addition)
const HomepageSections = () => {
  const { t } = useTranslation();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingSection, setEditingSection] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Load sections on page load
  useEffect(() => {
    testAPI();
    fetchCategories();
  }, []);

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5055/api/category/show');
      const data = await response.json();
      setAllCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Simple API test function
  const testAPI = async () => {
    try {
      setLoading(true);
      setMessage('Loading sections...');
      
      const response = await fetch('http://localhost:5055/api/homepage-sections/admin/all');
      const data = await response.json();
      
      // Ensure data is an array before using reduce
      const sectionsArray = Array.isArray(data) ? data : (data?.sections || []);
      
      // Remove any potential duplicates based on sectionId
      const uniqueSections = sectionsArray.reduce((acc, section) => {
        const existing = acc.find(s => s.sectionId === section.sectionId);
        if (!existing) {
          acc.push(section);
        }
        return acc;
      }, []);
      
      setSections(uniqueSections);
      setMessage(`✅ Loaded ${uniqueSections?.length || 0} sections`);
    } catch (error) {
      console.error('API Error:', error);
      setMessage('❌ API Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Clean up duplicates in database
  const cleanupDuplicates = async () => {
    try {
      setLoading(true);
      setMessage('Cleaning up duplicates...');
      
      const response = await fetch('http://localhost:5055/api/homepage-sections/cleanup-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setMessage('✅ Duplicates cleaned up!');
        testAPI(); // Reload sections
      } else {
        setMessage('❌ Failed to cleanup duplicates');
      }
    } catch (error) {
      console.error('Cleanup Error:', error);
      setMessage('❌ Cleanup Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle section on/off
  const toggleSection = async (sectionId, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:5055/api/homepage-sections/${sectionId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        // Update local state
        setSections(sections.map(section => 
          section.sectionId === sectionId 
            ? { ...section, isActive: !currentStatus }
            : section
        ));
        setMessage(`✅ ${sectionId} ${!currentStatus ? 'enabled' : 'disabled'}`);
      } else {
        setMessage('❌ Failed to toggle section');
      }
    } catch (error) {
      console.error('Toggle Error:', error);
      setMessage('❌ Toggle Error: ' + error.message);
    }
  };

  // Update sections order
  const updateSectionsOrder = async (newSections) => {
    try {
      const orderData = newSections.map((section, index) => ({
        sectionId: section.sectionId,
        sortOrder: index
      }));

      const response = await fetch('http://localhost:5055/api/homepage-sections/order/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: orderData })
      });

      if (response.ok) {
        setSections(newSections);
        setMessage('✅ Section order updated successfully!');
      } else {
        setMessage('❌ Failed to update section order');
      }
    } catch (error) {
      console.error('Order Update Error:', error);
      setMessage('❌ Order Update Error: ' + error.message);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      return;
    }

    const newSections = [...sections];
    const draggedSection = newSections[draggedItem];
    
    // Remove dragged item
    newSections.splice(draggedItem, 1);
    
    // Insert at new position
    newSections.splice(dropIndex, 0, draggedSection);
    
    // Update sort orders
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      sortOrder: index
    }));

    // Update order in database
    updateSectionsOrder(updatedSections);
    setDraggedItem(null);
  };

  // Start editing a section
  const startEdit = (section) => {
    // Load selected categories if editing categories section
    if (section.sectionId === 'categories') {
      const sectionCategories = section.settings?.selectedCategories || [];
      setSelectedCategories(sectionCategories);
    }

    setEditingSection({
      ...section,
      tempName: section.name?.en || '',
      tempDescription: section.description || '',
      // Content fields
      tempTitle: section.content?.title?.en || '',
      tempTitleAr: section.content?.title?.ar || '',
      tempContentDescription: section.content?.description?.en || '',
      tempContentDescriptionAr: section.content?.description?.ar || '',
      tempSubtitle: section.content?.subtitle?.en || '',
      tempSubtitleAr: section.content?.subtitle?.ar || '',
      tempButtonText: section.content?.buttonText?.en || '',
      tempButtonTextAr: section.content?.buttonText?.ar || '',
      tempButtonLink: section.content?.buttonLink || '',
      tempViewAllLink: section.content?.viewAllLink || '',
      tempPlaceholderText: section.content?.placeholderText?.en || '',
      tempPlaceholderTextAr: section.content?.placeholderText?.ar || '',
      // Settings fields
      tempMaxItems: section.settings?.maxItems || '',
      tempCardVariant: section.settings?.cardVariant || 'simple',
      tempGridCols: section.settings?.gridCols || 'lg:grid-cols-3',
      // Category settings
      tempShowAllProducts: section.settings?.showAllProducts !== false,
      tempScrollDirection: section.settings?.scrollDirection || 'horizontal',
      tempItemsPerView: section.settings?.itemsPerView || 6
    });
  };

  // Save section changes
  const saveSection = async () => {
    if (!editingSection) return;

    try {
      setLoading(true);
      const updateData = {
        ...editingSection,
        name: {
          en: editingSection.tempName,
          ar: editingSection.name?.ar || ''
        },
        description: editingSection.tempDescription,
        content: {
          title: { en: editingSection.tempTitle, ar: editingSection.tempTitleAr },
          description: { en: editingSection.tempContentDescription, ar: editingSection.tempContentDescriptionAr },
          subtitle: { en: editingSection.tempSubtitle, ar: editingSection.tempSubtitleAr },
          buttonText: {
            en: editingSection.tempButtonText,
            ar: editingSection.tempButtonTextAr
          },
          buttonLink: editingSection.tempButtonLink,
          viewAllLink: editingSection.tempViewAllLink,
          placeholderText: {
            en: editingSection.tempPlaceholderText,
            ar: editingSection.tempPlaceholderTextAr
          },
          ...(editingSection.sectionId === 'why_choose_us' && {
            stats: editingSection.content?.stats || []
          }),
          ...(editingSection.sectionId === 'trust_features' && {
            features: editingSection.content?.features || []
          }),
          ...(editingSection.sectionId === 'testimonials' && {
            testimonials: editingSection.content?.testimonials || []
          }),
          ...(editingSection.sectionId === 'social_links' && {
            links: editingSection.content?.links || [],
            contact: editingSection.content?.contact || {}
          })
        },
        settings: {
          maxItems: parseInt(editingSection.tempMaxItems) || undefined,
          cardVariant: editingSection.tempCardVariant,
          gridCols: editingSection.tempGridCols,
          ...(editingSection.sectionId === 'categories' && {
            selectedCategories: selectedCategories,
            showAllProducts: editingSection.tempShowAllProducts,
            scrollDirection: editingSection.tempScrollDirection,
            itemsPerView: parseInt(editingSection.tempItemsPerView) || 6
          })
        }
      };

      const response = await fetch(`http://localhost:5055/api/homepage-sections/${editingSection.sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        // Update local state
        setSections(sections.map(section => 
          section.sectionId === editingSection.sectionId ? updateData : section
        ));
        setEditingSection(null);
        setMessage('✅ Section updated successfully!');
      } else {
        setMessage('❌ Failed to update section');
      }
    } catch (error) {
      console.error('Save Error:', error);
      setMessage('❌ Save Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Initialize sections if none exist
  const initializeSections = async () => {
    try {
      setLoading(true);
      setMessage('Creating default sections...');
      
      const response = await fetch('http://localhost:5055/api/homepage-sections/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setMessage('✅ Default sections created!');
        testAPI(); // Reload sections
      } else {
        setMessage('❌ Failed to create sections');
      }
    } catch (error) {
      console.error('Initialize Error:', error);
      setMessage('❌ Initialize Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get section-specific content fields
  const getSectionContentFields = (sectionId) => {
    const commonFields = ['title', 'description'];
    
    switch (sectionId) {
      case 'hero':
        return []; // No editable content for hero

      case 'why_choose_us':
        return ['title', 'subtitle', 'description'];
      
      case 'categories':
        return ['title', 'description', 'categoryManagement'];
      
      case 'trust_features':
      case 'testimonials':
        return ['title', 'description'];
      
      case 'special_prices':
      case 'combo_deals':
        return ['title', 'description', 'maxItems'];
      
      case 'featured_products':
      case 'popular_products':
      case 'discount_products':
        return ['title', 'description', 'viewAllLink', 'maxItems', 'cardVariant', 'gridCols'];
      
      case 'banner_section':
        return ['title', 'description', 'buttonText', 'buttonLink'];
      
      case 'newsletter':
        return ['title', 'description', 'buttonText', 'placeholderText'];
      
      case 'social_links':
        return ['links']; // placeholder to ensure modal renders custom editor
      
      default:
        return commonFields;
    }
  };

  const updateEditingSection = (field, value, language = null) => {
    setEditingSection(prev => {
      const updated = { ...prev };
      if (language) {
        const keys = field.split('.');
        let current = updated;
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          if (i === keys.length - 1) {
            if (!current[k]) current[k] = {};
            current[k][language] = value;
          } else {
            if (!current[k]) current[k] = {};
            current = current[k];
          }
        }
      } else if (field.includes('.')) {
        const keys = field.split('.');
        let current = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
      } else {
        updated[field] = value;
      }
      return updated;
    });
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Homepage Sections Management</h2>
        <p className="text-gray-600 mb-4">Manage your homepage sections here. Toggle them on/off, edit their content, and drag to reorder.</p>
        
        {/* Control Buttons */}
        <div className="border rounded p-4 bg-gray-50 mb-4">
          <div className="flex gap-2 mb-3">
            <button 
              onClick={testAPI}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button 
              onClick={cleanupDuplicates}
              disabled={loading}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Fix Duplicates'}
            </button>
            {sections.length === 0 && (
              <button 
                onClick={initializeSections}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Initialize Sections'}
              </button>
            )}
          </div>
          {message && (
            <p className="text-sm text-blue-600">{message}</p>
          )}
        </div>

        {/* Sections Management */}
        {sections.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium mb-3">Homepage Sections ({sections.length}) - Drag to reorder</h3>
            {sections
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((section, index) => (
                <div 
                  key={section.sectionId || index} 
                  className={`border rounded-lg p-4 bg-white shadow-sm cursor-move transition-all ${
                    draggedItem === index ? 'opacity-50 scale-95' : 'hover:shadow-md'
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 cursor-move">⋮⋮</span>
                        <span className="font-medium text-lg">{section.name?.en || section.sectionId}</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          section.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {section.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-sm text-gray-500">Order: {section.sortOrder + 1}</span>
                      </div>
                      {section.description && (
                        <p className="text-sm text-gray-600 mt-1 ml-6">{section.description}</p>
                      )}
                      {section.content?.title?.en && (
                        <p className="text-sm text-blue-600 mt-1 ml-6">Title: "{section.content.title.en}"</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Toggle Switch */}
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={section.isActive}
                          onChange={() => toggleSection(section.sectionId, section.isActive)}
                          className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                      
                      {/* Edit Button */}
                      <button
                        onClick={() => startEdit(section)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Edit Content
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Edit: {editingSection.name?.en || editingSection.sectionId}
              </h3>
              
              <div className="space-y-4">
                {/* Content Fields */}
                {getSectionContentFields(editingSection.sectionId).length > 0 && (
                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-2">Content Settings</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {getSectionContentFields(editingSection.sectionId).includes('title') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                              Display Title (English)
                          </label>
                          <input
                            type="text"
                            value={editingSection.tempTitle}
                            onChange={(e) => setEditingSection({
                              ...editingSection, 
                              tempTitle: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter display title"
                          />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Display Title (Arabic)
                            </label>
                            <input
                              type="text"
                              dir="rtl"
                              value={editingSection.tempTitleAr}
                              onChange={(e) => setEditingSection({
                                ...editingSection, 
                                tempTitleAr: e.target.value
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="أدخل عنوان العرض"
                            />
                          </div>
                        </div>
                      )}

                      {getSectionContentFields(editingSection.sectionId).includes('description') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                              Display Description (English)
                          </label>
                          <textarea
                            value={editingSection.tempContentDescription}
                            onChange={(e) => setEditingSection({
                              ...editingSection, 
                              tempContentDescription: e.target.value
                            })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter display description"
                          />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Display Description (Arabic)
                            </label>
                            <textarea
                              dir="rtl"
                              value={editingSection.tempContentDescriptionAr}
                              onChange={(e) => setEditingSection({
                                ...editingSection, 
                                tempContentDescriptionAr: e.target.value
                              })}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="أدخل وصف العرض"
                            />
                          </div>
                        </div>
                      )}

                      {getSectionContentFields(editingSection.sectionId).includes('buttonText') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Button Text (English)
                            </label>
                            <input
                              type="text"
                              value={editingSection.tempButtonText}
                              onChange={(e) => setEditingSection({
                                ...editingSection, 
                                tempButtonText: e.target.value
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Shop Now"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Button Text (Arabic)
                            </label>
                            <input
                              type="text"
                              dir="rtl"
                              value={editingSection.tempButtonTextAr}
                              onChange={(e) => setEditingSection({
                                ...editingSection, 
                                tempButtonTextAr: e.target.value
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="تسوق الآن"
                            />
                          </div>
                        </div>
                      )}

                      {getSectionContentFields(editingSection.sectionId).includes('viewAllLink') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            View All Link
                          </label>
                          <input
                            type="text"
                            value={editingSection.tempViewAllLink}
                            onChange={(e) => setEditingSection({
                              ...editingSection, 
                              tempViewAllLink: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="/products"
                          />
                        </div>
                      )}

                      {getSectionContentFields(editingSection.sectionId).includes('placeholderText') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                              Placeholder (English)
                          </label>
                          <input
                            type="text"
                            value={editingSection.tempPlaceholderText}
                            onChange={(e) => setEditingSection({
                              ...editingSection, 
                              tempPlaceholderText: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter your email address"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Placeholder (Arabic)
                            </label>
                            <input
                              type="text"
                              dir="rtl"
                              value={editingSection.tempPlaceholderTextAr}
                              onChange={(e) => setEditingSection({
                                ...editingSection, 
                                tempPlaceholderTextAr: e.target.value
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="أدخل بريدك الإلكتروني"
                            />
                          </div>
                        </div>
                      )}

                      {/* Category Management */}
                      {getSectionContentFields(editingSection.sectionId).includes('categoryManagement') && (
                        <div className="border-t pt-4">
                          <h5 className="font-medium mb-3">Category Management</h5>
                          
                          {/* Display Settings */}
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Items Per View
                              </label>
                              <input
                                type="number"
                                value={editingSection.tempItemsPerView}
                                onChange={(e) => setEditingSection({
                                  ...editingSection, 
                                  tempItemsPerView: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="6"
                                min="3"
                                max="12"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Scroll Direction
                              </label>
                              <select
                                value={editingSection.tempScrollDirection}
                                onChange={(e) => setEditingSection({
                                  ...editingSection, 
                                  tempScrollDirection: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="horizontal">Horizontal</option>
                                <option value="vertical">Vertical</option>
                              </select>
                            </div>
                            
                            <div className="flex items-center">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editingSection.tempShowAllProducts}
                                  onChange={(e) => setEditingSection({
                                    ...editingSection, 
                                    tempShowAllProducts: e.target.checked
                                  })}
                                  className="mr-2"
                                />
                                <span className="text-sm text-gray-700">Show "All Products"</span>
                              </label>
                            </div>
                          </div>

                          {/* Category Selection */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Select Categories to Display (drag to reorder)
                            </label>
                            
                            {/* Available Categories */}
                            <div className="mb-4">
                              <h6 className="text-sm font-medium text-gray-600 mb-2">Available Categories:</h6>
                              <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                                {allCategories
                                  .filter(cat => !selectedCategories.find(sel => sel.categoryId === cat._id))
                                  .map(category => (
                                    <div 
                                      key={category._id}
                                      className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
                                      onClick={() => {
                                        const newSelected = [...selectedCategories, {
                                          categoryId: category._id,
                                          name: category.name,
                                          icon: category.icon,
                                          sortOrder: selectedCategories.length
                                        }];
                                        setSelectedCategories(newSelected);
                                      }}
                                    >
                                      <span className="text-sm">{category.name?.en || category.name}</span>
                                      <button className="text-blue-600 text-sm">+ Add</button>
                                    </div>
                                  ))
                                }
                              </div>
                            </div>

                            {/* Selected Categories */}
                            <div>
                              <h6 className="text-sm font-medium text-gray-600 mb-2">Selected Categories (in display order):</h6>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {selectedCategories.map((category, index) => (
                                  <div 
                                    key={category.categoryId}
                                    className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded"
                                  >
                                    <div className="flex items-center">
                                      <span className="text-gray-400 cursor-move mr-2">⋮⋮</span>
                                      <span className="text-sm font-medium">{index + 1}.</span>
                                      <span className="text-sm ml-2">{category.name?.en || category.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          if (index > 0) {
                                            const newSelected = [...selectedCategories];
                                            [newSelected[index], newSelected[index - 1]] = [newSelected[index - 1], newSelected[index]];
                                            setSelectedCategories(newSelected);
                                          }
                                        }}
                                        className="text-gray-600 hover:text-gray-800"
                                        disabled={index === 0}
                                      >
                                        ↑
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (index < selectedCategories.length - 1) {
                                            const newSelected = [...selectedCategories];
                                            [newSelected[index], newSelected[index + 1]] = [newSelected[index + 1], newSelected[index]];
                                            setSelectedCategories(newSelected);
                                          }
                                        }}
                                        className="text-gray-600 hover:text-gray-800"
                                        disabled={index === selectedCategories.length - 1}
                                      >
                                        ↓
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedCategories(selectedCategories.filter((_, i) => i !== index));
                                        }}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Why Choose Us Editor */}
                      {editingSection.sectionId === 'why_choose_us' && (
                        <div className="mt-6">
                          <h4 className="font-medium mb-3">Why Choose Us Content</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (EN)</label>
                              <input
                                type="text"
                                value={editingSection.tempSubtitle}
                                onChange={(e) => setEditingSection({ ...editingSection, tempSubtitle: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (AR)</label>
                              <input
                                type="text"
                                dir="rtl"
                                value={editingSection.tempSubtitleAr}
                                onChange={(e) => setEditingSection({ ...editingSection, tempSubtitleAr: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          {/* Stats Repeater */}
                          <div className="space-y-4">
                            {(editingSection.content?.stats || []).map((stat, index) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-3">
                                  <h5 className="font-medium text-gray-700">Stat {index + 1}</h5>
                                  <button type="button" onClick={() => {
                                    const list = [...(editingSection.content?.stats || [])];
                                    list.splice(index,1);
                                    updateEditingSection('content.stats', list);
                                  }} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Value (EN)</label>
                                    <input type="text" value={stat.value?.en || ''} onChange={(e)=>{
                                      const list=[...(editingSection.content?.stats||[])];
                                      list[index]={
                                        ...list[index],
                                        value:{...(list[index].value||{}),en:e.target.value}
                                      };
                                      updateEditingSection('content.stats',list);
                                    }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Value (AR)</label>
                                    <input dir="rtl" type="text" value={stat.value?.ar || ''} onChange={(e)=>{
                                      const list=[...(editingSection.content?.stats||[])];
                                      list[index]={
                                        ...list[index],
                                        value:{...(list[index].value||{}),ar:e.target.value}
                                      };
                                      updateEditingSection('content.stats',list);
                                    }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Label (EN)</label>
                                    <input type="text" value={stat.label?.en||''} onChange={(e)=>{
                                      const list=[...(editingSection.content?.stats||[])];
                                      list[index]={...list[index],label:{...(list[index].label||{}),en:e.target.value}};
                                      updateEditingSection('content.stats',list);
                                    }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Label (AR)</label>
                                    <input dir="rtl" type="text" value={stat.label?.ar||''} onChange={(e)=>{
                                      const list=[...(editingSection.content?.stats||[])];
                                      list[index]={...list[index],label:{...(list[index].label||{}),ar:e.target.value}};
                                      updateEditingSection('content.stats',list);
                                    }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                  </div>
                                </div>
                              </div>
                            ))}
                            <button type="button" onClick={()=>{
                              const list=[...(editingSection.content?.stats||[]),{value:{en:'',ar:''},label:{en:'',ar:''}}];
                              updateEditingSection('content.stats',list);
                            }} className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700">+ Add Stat</button>
                          </div>
                        </div>
                      )}

                      {/* Trust Features – Feature List Editor */}
                      {editingSection.sectionId === 'trust_features' && (
                        <div className="mt-6">
                          <h4 className="font-medium mb-3">Features</h4>
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
                                    className="text-red-500 hover:text-red-700 text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title (English)</label>
                                    <input
                                      type="text"
                                      value={feature.title?.en || ''}
                                      onChange={(e) => {
                                        const newFeatures = [...(editingSection.content?.features || [])];
                                        newFeatures[index] = {
                                          ...newFeatures[index],
                                          title: { ...(newFeatures[index]?.title || {}), en: e.target.value }
                                        };
                                        updateEditingSection('content.features', newFeatures);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Free Same-Day Delivery"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title (Arabic)</label>
                                    <input
                                      type="text"
                                      value={feature.title?.ar || ''}
                                      onChange={(e) => {
                                        const newFeatures = [...(editingSection.content?.features || [])];
                                        newFeatures[index] = {
                                          ...newFeatures[index],
                                          title: { ...(newFeatures[index]?.title || {}), ar: e.target.value }
                                        };
                                        updateEditingSection('content.features', newFeatures);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="توصيل مجاني في نفس اليوم"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
                                    <textarea
                                      rows={2}
                                      value={feature.description?.en || ''}
                                      onChange={(e) => {
                                        const newFeatures = [...(editingSection.content?.features || [])];
                                        newFeatures[index] = {
                                          ...newFeatures[index],
                                          description: { ...(newFeatures[index]?.description || {}), en: e.target.value }
                                        };
                                        updateEditingSection('content.features', newFeatures);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Order by 2 PM for same-day delivery — no minimum purchase"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Arabic)</label>
                                    <textarea
                                      rows={2}
                                      value={feature.description?.ar || ''}
                                      onChange={(e) => {
                                        const newFeatures = [...(editingSection.content?.features || [])];
                                        newFeatures[index] = {
                                          ...newFeatures[index],
                                          description: { ...(newFeatures[index]?.description || {}), ar: e.target.value }
                                        };
                                        updateEditingSection('content.features', newFeatures);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="اطلب قبل الساعة 2 ظهراً للحصول على التوصيل في نفس اليوم - بدون حد أدنى"
                                    />
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
                      )}

                      {/* Testimonials Editor */}
                      {editingSection.sectionId === 'testimonials' && (
                        <div className="mt-6">
                          <h4 className="font-medium mb-3">Testimonials</h4>
                          <div className="space-y-4">
                            {(editingSection.content?.testimonials || []).map((item, index) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-3">
                                  <h5 className="font-medium text-gray-700">Testimonial {index + 1}</h5>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newList = [...(editingSection.content?.testimonials || [])];
                                      newList.splice(index, 1);
                                      updateEditingSection('content.testimonials', newList);
                                    }}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>

                                {/* Customer Image */}
                                <div className="mb-3">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Image</label>
                                  <UploaderWithCropper
                                    imageUrl={item.image || ''}
                                    setImageUrl={(url) => {
                                      const newList = [...(editingSection.content?.testimonials || [])];
                                      newList[index] = { ...newList[index], image: url };
                                      updateEditingSection('content.testimonials', newList);
                                    }}
                                    context="profile-avatar"
                                    folder="testimonials"
                                    title="Upload Image"
                                  />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
                                    <input
                                      type="text"
                                      value={item.name?.en || ''}
                                      onChange={(e) => {
                                        const newList = [...(editingSection.content?.testimonials || [])];
                                        newList[index] = {
                                          ...newList[index],
                                          name: { ...(newList[index]?.name || {}), en: e.target.value }
                                        };
                                        updateEditingSection('content.testimonials', newList);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="John Doe"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name (Arabic)</label>
                                    <input
                                      type="text"
                                      dir="rtl"
                                      value={item.name?.ar || ''}
                                      onChange={(e) => {
                                        const newList = [...(editingSection.content?.testimonials || [])];
                                        newList[index] = {
                                          ...newList[index],
                                          name: { ...(newList[index]?.name || {}), ar: e.target.value }
                                        };
                                        updateEditingSection('content.testimonials', newList);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="محمد علي"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message (English)</label>
                                    <textarea
                                      rows={2}
                                      value={item.message?.en || ''}
                                      onChange={(e) => {
                                        const newList = [...(editingSection.content?.testimonials || [])];
                                        newList[index] = {
                                          ...newList[index],
                                          message: { ...(newList[index]?.message || {}), en: e.target.value }
                                        };
                                        updateEditingSection('content.testimonials', newList);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Great service ..."
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message (Arabic)</label>
                                    <textarea
                                      rows={2}
                                      dir="rtl"
                                      value={item.message?.ar || ''}
                                      onChange={(e) => {
                                        const newList = [...(editingSection.content?.testimonials || [])];
                                        newList[index] = {
                                          ...newList[index],
                                          message: { ...(newList[index]?.message || {}), ar: e.target.value }
                                        };
                                        updateEditingSection('content.testimonials', newList);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="خدمة رائعة ..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                                    <select
                                      value={item.rating || 5}
                                      onChange={(e) => {
                                        const newList = [...(editingSection.content?.testimonials || [])];
                                        newList[index] = { ...newList[index], rating: parseInt(e.target.value) };
                                        updateEditingSection('content.testimonials', newList);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      {[1,2,3,4,5].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const newList = [...(editingSection.content?.testimonials || []), {
                                  image: '',
                                  name: { en: '', ar: '' },
                                  message: { en: '', ar: '' },
                                  rating: 5
                                }];
                                updateEditingSection('content.testimonials', newList);
                              }}
                              className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
                            >
                              + Add Testimonial
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Social Links Editor */}
                      {editingSection.sectionId === 'social_links' && (
                        <div className="mt-6">
                          <h4 className="font-medium mb-3">Social Links & Store Info</h4>
                          {/* Links Repeater */}
                          <div className="space-y-4 mb-6">
                            {(editingSection.content?.links || []).map((link, index) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-3">
                                  <h5 className="font-medium text-gray-700">Link {index + 1}</h5>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const list = [...(editingSection.content?.links || [])];
                                      list.splice(index, 1);
                                      updateEditingSection('content.links', list);
                                    }}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                  >Remove</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                                    <select
                                      value={link.iconType || 'facebook'}
                                      onChange={(e) => {
                                        const list = [...(editingSection.content?.links || [])];
                                        list[index] = { ...list[index], iconType: e.target.value };
                                        updateEditingSection('content.links', list);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      {['facebook','twitter','instagram','linkedin','youtube','pinterest','whatsapp','tiktok','snapchat'].map(icon => (
                                        <option key={icon} value={icon}>{icon}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                                    <input
                                      type="text"
                                      value={link.url || ''}
                                      onChange={(e) => {
                                        const list = [...(editingSection.content?.links || [])];
                                        list[index] = { ...list[index], url: e.target.value };
                                        updateEditingSection('content.links', list);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="https://..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Label (EN)</label>
                                    <input
                                      type="text"
                                      value={link.label?.en || ''}
                                      onChange={(e) => {
                                        const list = [...(editingSection.content?.links || [])];
                                        list[index] = { ...list[index], label: { ...(list[index]?.label || {}), en: e.target.value } };
                                        updateEditingSection('content.links', list);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Label (AR)</label>
                                    <input
                                      type="text"
                                      dir="rtl"
                                      value={link.label?.ar || ''}
                                      onChange={(e) => {
                                        const list = [...(editingSection.content?.links || [])];
                                        list[index] = { ...list[index], label: { ...(list[index]?.label || {}), ar: e.target.value } };
                                        updateEditingSection('content.links', list);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...(editingSection.content?.links || []), { iconType: 'facebook', url: '', label: { en: '', ar: '' } }];
                                updateEditingSection('content.links', list);
                              }}
                              className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
                            >+ Add Link</button>
                          </div>
                          {/* Contact Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                              <input
                                type="text"
                                value={editingSection.content?.contact?.phone || ''}
                                onChange={(e) => {
                                  updateEditingSection('content.contact.phone', e.target.value);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                              <input
                                type="text"
                                value={editingSection.content?.contact?.email || ''}
                                onChange={(e) => {
                                  updateEditingSection('content.contact.email', e.target.value);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Address (EN)</label>
                              <input
                                type="text"
                                value={editingSection.content?.contact?.address?.en || ''}
                                onChange={(e) => {
                                  updateEditingSection('content.contact.address', e.target.value, 'en');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Address (AR)</label>
                              <input
                                type="text"
                                dir="rtl"
                                value={editingSection.content?.contact?.address?.ar || ''}
                                onChange={(e) => {
                                  updateEditingSection('content.contact.address', e.target.value, 'ar');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Settings Fields */}
                {(getSectionContentFields(editingSection.sectionId).includes('maxItems') || 
                  getSectionContentFields(editingSection.sectionId).includes('cardVariant')) && (
                  <div>
                    <h4 className="font-medium mb-2">Display Settings</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {getSectionContentFields(editingSection.sectionId).includes('maxItems') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Items
                          </label>
                          <input
                            type="number"
                            value={editingSection.tempMaxItems}
                            onChange={(e) => setEditingSection({
                              ...editingSection, 
                              tempMaxItems: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="8"
                          />
                        </div>
                      )}

                      {getSectionContentFields(editingSection.sectionId).includes('cardVariant') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Card Style
                          </label>
                          <select
                            value={editingSection.tempCardVariant}
                            onChange={(e) => setEditingSection({
                              ...editingSection, 
                              tempCardVariant: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="simple">Simple</option>
                            <option value="detailed">Detailed</option>
                          </select>
                        </div>
                      )}

                      {getSectionContentFields(editingSection.sectionId).includes('gridCols') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Grid Layout
                          </label>
                          <select
                            value={editingSection.tempGridCols}
                            onChange={(e) => setEditingSection({
                              ...editingSection, 
                              tempGridCols: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="lg:grid-cols-2">2 Columns</option>
                            <option value="lg:grid-cols-3">3 Columns</option>
                            <option value="lg:grid-cols-4">4 Columns</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSection}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StoreHome = () => {
  const { t } = useTranslation();
  const location = useLocation();

  // Get storeTab from URL parameters using URLSearchParams
  const searchParams = new URLSearchParams(location.search);
  const storeTab = searchParams.get("storeTab") || "home-settings";

  // Use the original store home hook
  const {
    register,
    handleSubmit,
    setValue,
    onSubmit,
    errors,
    imageUrl,
    setImageUrl,
    isSave,
    isSubmitting,
    // All the state variables from the original hook
    headerLogo,
    setHeaderLogo,
    sliderImage,
    setSliderImage,
    sliderImageTwo,
    setSliderImageTwo,
    sliderImageThree,
    setSliderImageThree,
    sliderImageFour,
    setSliderImageFour,
    sliderImageFive,
    setSliderImageFive,
    placeholderImage,
    setPlaceHolderImage,
    quickSectionImage,
    setQuickSectionImage,
    getYourDailyNeedImageLeft,
    setGetYourDailyNeedImageLeft,
    getYourDailyNeedImageRight,
    setGetYourDailyNeedImageRight,
    footerLogo,
    setFooterLogo,
    paymentImage,
    setPaymentImage,
    isCoupon,
    isSliderFullWidth,
    setIsCoupon,
    setIsSliderFullWidth,
    featuredCategories,
    setFeaturedCategories,
    popularProducts,
    setPopularProducts,
    setQuickDelivery,
    quickDelivery,
    setLatestDiscounted,
    latestDiscounted,
    setDailyNeeds,
    dailyNeeds,
    setFeaturePromo,
    featurePromo,
    setFooterBlock1,
    footerBlock1,
    setFooterBlock2,
    footerBlock2,
    setFooterBlock3,
    footerBlock3,
    setFooterBlock4,
    footerBlock4,
    setFooterSocialLinks,
    footerSocialLinks,
    setFooterPaymentMethod,
    footerPaymentMethod,
    allowPromotionBanner,
    setAllowPromotionBanner,
    setLeftRightArrow,
    leftRightArrow,
    setBottomDots,
    bottomDots,
    setBothSliderOption,
    bothSliderOption,
    getButton1image,
    setGetButton1image,
    getButton2image,
    setGetButton2image,
    setFooterBottomContact,
    footerBottomContact,
    setCategoriesMenuLink,
    categoriesMenuLink,
    setAboutUsMenuLink,
    aboutUsMenuLink,
    setContactUsMenuLink,
    contactUsMenuLink,
    setOffersMenuLink,
    offersMenuLink,
    setFaqMenuLink,
    faqMenuLink,
    setPrivacyPolicyMenuLink,
    privacyPolicyMenuLink,
    setTermsConditionsMenuLink,
    termsConditionsMenuLink,
    couponList,
    setCouponList,
    // About Us states
    setAboutHeaderBg,
    aboutHeaderBg,
    setAboutPageHeader,
    aboutPageHeader,
    setAboutTopContentLeft,
    aboutTopContentLeft,
    setAboutTopContentRight,
    aboutTopContentRight,
    setAboutTopContentRightImage,
    aboutTopContentRightImage,
    setAboutMiddleContentSection,
    aboutMiddleContentSection,
    setAboutMiddleContentImage,
    aboutMiddleContentImage,
    setOurFounderSection,
    ourFounderSection,
    setOurFounderOneImage,
    ourFounderOneImage,
    setOurFounderTwoImage,
    ourFounderTwoImage,
    setOurFounderThreeImage,
    ourFounderThreeImage,
    setOurFounderFourImage,
    ourFounderFourImage,
    setOurFounderFiveImage,
    ourFounderFiveImage,
    setOurFounderSixImage,
    ourFounderSixImage,
    // Additional founder images
    setOurFounderSevenImage,
    ourFounderSevenImage,
    setOurFounderEightImage,
    ourFounderEightImage,
    setOurFounderNineImage,
    ourFounderNineImage,
    setOurFounderTenImage,
    ourFounderTenImage,
    setOurFounderElevenImage,
    ourFounderElevenImage,
    setOurFounderTwelveImage,
    ourFounderTwelveImage,
    // About Us section toggles
    setAboutCoreValues,
    aboutCoreValues,
    setAboutBranches,
    aboutBranches,
    // Privacy Policy states
    setPrivacyPolicy,
    privacyPolicy,
    setTermsConditions,
    termsConditions,
    setPrivacyPolicyHeaderBg,
    privacyPolicyHeaderBg,
    setTermsConditionsHeaderBg,
    termsConditionsHeaderBg,
    textEdit,
    setTextEdit,
    termsConditionsTextEdit,
    setTermsConditionsTextEdit,
    // FAQ states
    setFaqStatus,
    faqStatus,
    setFaqHeaderBg,
    faqHeaderBg,
    setFaqLeftColStatus,
    faqLeftColStatus,
    setFaqLeftColImage,
    faqLeftColImage,
    setFaqRightColStatus,
    faqRightColStatus,
    setEmailUsBox,
    emailUsBox,
    setCallUsBox,
    callUsBox,
    setAddressBox,
    addressBox,
    // Contact Us states
    setContactPageHeader,
    contactPageHeader,
    setContactHeaderBg,
    contactHeaderBg,
    setContactFormStatus,
    contactFormStatus,
    setContactMidLeftColStatus,
    contactMidLeftColStatus,
    setContactMidLeftColImage,
    contactMidLeftColImage,
    // Single Page states
    setSingleProductPageRightBox,
    singleProductPageRightBox,
    // Offers states
    setOffersPageHeader,
    offersPageHeader,
    setOffersHeaderBg,
    offersHeaderBg,
    couponList1,
    setCouponList1,
    // Discount coupon states
    setDiscount_coupon_status,
    discount_coupon_status,
    // All other states from the hook
    control,
    coupons,
    handleSelectLanguage,
  } = useStoreHomeSubmit();

  // Render the appropriate tab content
  const renderTabContent = () => {
    switch (storeTab) {
      case "home-settings":
        return (
          <HomePage
            register={register}
            errors={errors}
            coupons={coupons}
            headerLogo={headerLogo}
            setHeaderLogo={setHeaderLogo}
            sliderImage={sliderImage}
            setSliderImage={setSliderImage}
            sliderImageTwo={sliderImageTwo}
            setSliderImageTwo={setSliderImageTwo}
            sliderImageThree={sliderImageThree}
            setSliderImageThree={setSliderImageThree}
            sliderImageFour={sliderImageFour}
            setSliderImageFour={setSliderImageFour}
            sliderImageFive={sliderImageFive}
            setSliderImageFive={setSliderImageFive}
            placeholderImage={placeholderImage}
            setPlaceHolderImage={setPlaceHolderImage}
            quickSectionImage={quickSectionImage}
            setQuickSectionImage={setQuickSectionImage}
            getYourDailyNeedImageLeft={getYourDailyNeedImageLeft}
            setGetYourDailyNeedImageLeft={setGetYourDailyNeedImageLeft}
            getYourDailyNeedImageRight={getYourDailyNeedImageRight}
            setGetYourDailyNeedImageRight={setGetYourDailyNeedImageRight}
            footerLogo={footerLogo}
            setFooterLogo={setFooterLogo}
            paymentImage={paymentImage}
            setPaymentImage={setPaymentImage}
            isSave={isSave}
            isCoupon={isCoupon}
            isSliderFullWidth={isSliderFullWidth}
            setIsCoupon={setIsCoupon}
            setIsSliderFullWidth={setIsSliderFullWidth}
            featuredCategories={featuredCategories}
            setFeaturedCategories={setFeaturedCategories}
            popularProducts={popularProducts}
            setPopularProducts={setPopularProducts}
            setQuickDelivery={setQuickDelivery}
            quickDelivery={quickDelivery}
            setLatestDiscounted={setLatestDiscounted}
            latestDiscounted={latestDiscounted}
            setDailyNeeds={setDailyNeeds}
            dailyNeeds={dailyNeeds}
            setFeaturePromo={setFeaturePromo}
            featurePromo={featurePromo}
            setFooterBlock1={setFooterBlock1}
            footerBlock1={footerBlock1}
            setFooterBlock2={setFooterBlock2}
            footerBlock2={footerBlock2}
            setFooterBlock3={setFooterBlock3}
            footerBlock3={footerBlock3}
            setFooterBlock4={setFooterBlock4}
            footerBlock4={footerBlock4}
            setFooterSocialLinks={setFooterSocialLinks}
            footerSocialLinks={footerSocialLinks}
            setFooterPaymentMethod={setFooterPaymentMethod}
            footerPaymentMethod={footerPaymentMethod}
            allowPromotionBanner={allowPromotionBanner}
            setAllowPromotionBanner={setAllowPromotionBanner}
            isSubmitting={isSubmitting}
            setLeftRightArrow={setLeftRightArrow}
            leftRightArrow={leftRightArrow}
            setBottomDots={setBottomDots}
            bottomDots={bottomDots}
            setBothSliderOption={setBothSliderOption}
            bothSliderOption={bothSliderOption}
            getButton1image={getButton1image}
            setGetButton1image={setGetButton1image}
            getButton2image={getButton2image}
            setGetButton2image={setGetButton2image}
            setFooterBottomContact={setFooterBottomContact}
            footerBottomContact={footerBottomContact}
            setCategoriesMenuLink={setCategoriesMenuLink}
            categoriesMenuLink={categoriesMenuLink}
            setAboutUsMenuLink={setAboutUsMenuLink}
            aboutUsMenuLink={aboutUsMenuLink}
            setContactUsMenuLink={setContactUsMenuLink}
            contactUsMenuLink={contactUsMenuLink}
            setOffersMenuLink={setOffersMenuLink}
            offersMenuLink={offersMenuLink}
            setFaqMenuLink={setFaqMenuLink}
            faqMenuLink={faqMenuLink}
            setPrivacyPolicyMenuLink={setPrivacyPolicyMenuLink}
            privacyPolicyMenuLink={privacyPolicyMenuLink}
            setTermsConditionsMenuLink={setTermsConditionsMenuLink}
            termsConditionsMenuLink={termsConditionsMenuLink}
            couponList={couponList}
            setCouponList={setCouponList}
          />
        );

      case "single-setting":
        return (
          <SinglePage
            register={register}
            errors={errors}
            isSave={isSave}
            isSubmitting={isSubmitting}
            setSingleProductPageRightBox={setSingleProductPageRightBox}
            singleProductPageRightBox={singleProductPageRightBox}
          />
        );

      case "about-us-setting":
        return (
          <AboutUs
            register={register}
            control={control}
            errors={errors}
            isSave={isSave}
            isSubmitting={isSubmitting}
            setAboutHeaderBg={setAboutHeaderBg}
            aboutHeaderBg={aboutHeaderBg}
            setAboutPageHeader={setAboutPageHeader}
            aboutPageHeader={aboutPageHeader}
            setAboutTopContentLeft={setAboutTopContentLeft}
            aboutTopContentLeft={aboutTopContentLeft}
            setAboutTopContentRight={setAboutTopContentRight}
            aboutTopContentRight={aboutTopContentRight}
            setAboutTopContentRightImage={setAboutTopContentRightImage}
            aboutTopContentRightImage={aboutTopContentRightImage}
            setAboutMiddleContentSection={setAboutMiddleContentSection}
            aboutMiddleContentSection={aboutMiddleContentSection}
            setAboutMiddleContentImage={setAboutMiddleContentImage}
            aboutMiddleContentImage={aboutMiddleContentImage}
            setOurFounderSection={setOurFounderSection}
            ourFounderSection={ourFounderSection}
            setOurFounderOneImage={setOurFounderOneImage}
            ourFounderOneImage={ourFounderOneImage}
            setOurFounderTwoImage={setOurFounderTwoImage}
            ourFounderTwoImage={ourFounderTwoImage}
            setOurFounderThreeImage={setOurFounderThreeImage}
            ourFounderThreeImage={ourFounderThreeImage}
            setOurFounderFourImage={setOurFounderFourImage}
            ourFounderFourImage={ourFounderFourImage}
            setOurFounderFiveImage={setOurFounderFiveImage}
            ourFounderFiveImage={ourFounderFiveImage}
            setOurFounderSixImage={setOurFounderSixImage}
            ourFounderSixImage={ourFounderSixImage}
            // Additional founder images
            setOurFounderSevenImage={setOurFounderSevenImage}
            ourFounderSevenImage={ourFounderSevenImage}
            setOurFounderEightImage={setOurFounderEightImage}
            ourFounderEightImage={ourFounderEightImage}
            setOurFounderNineImage={setOurFounderNineImage}
            ourFounderNineImage={ourFounderNineImage}
            setOurFounderTenImage={setOurFounderTenImage}
            ourFounderTenImage={ourFounderTenImage}
            setOurFounderElevenImage={setOurFounderElevenImage}
            ourFounderElevenImage={ourFounderElevenImage}
            setOurFounderTwelveImage={setOurFounderTwelveImage}
            ourFounderTwelveImage={ourFounderTwelveImage}
            // Section toggles
            setAboutCoreValues={setAboutCoreValues}
            aboutCoreValues={aboutCoreValues}
            setAboutBranches={setAboutBranches}
            aboutBranches={aboutBranches}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            handleSelectLanguage={handleSelectLanguage}
          />
        );

      case "privacy-setting":
        return (
          <PrivacyPolicy
            register={register}
            errors={errors}
            isSave={isSave}
            isSubmitting={isSubmitting}
            setPrivacyPolicy={setPrivacyPolicy}
            privacyPolicy={privacyPolicy}
            setTermsConditions={setTermsConditions}
            termsConditions={termsConditions}
            setPrivacyPolicyHeaderBg={setPrivacyPolicyHeaderBg}
            privacyPolicyHeaderBg={privacyPolicyHeaderBg}
            setTermsConditionsHeaderBg={setTermsConditionsHeaderBg}
            termsConditionsHeaderBg={termsConditionsHeaderBg}
            textEdit={textEdit}
            setTextEdit={setTextEdit}
            termsConditionsTextEdit={termsConditionsTextEdit}
            setTermsConditionsTextEdit={setTermsConditionsTextEdit}
          />
        );

      case "FAQ-setting":
        return (
          <Faq
            register={register}
            errors={errors}
            isSave={isSave}
            isSubmitting={isSubmitting}
            setFaqStatus={setFaqStatus}
            faqStatus={faqStatus}
            setFaqHeaderBg={setFaqHeaderBg}
            faqHeaderBg={faqHeaderBg}
            setFaqLeftColStatus={setFaqLeftColStatus}
            faqLeftColStatus={faqLeftColStatus}
            setFaqLeftColImage={setFaqLeftColImage}
            faqLeftColImage={faqLeftColImage}
            setFaqRightColStatus={setFaqRightColStatus}
            faqRightColStatus={faqRightColStatus}
            setEmailUsBox={setEmailUsBox}
            emailUsBox={emailUsBox}
            setCallUsBox={setCallUsBox}
            callUsBox={callUsBox}
            setAddressBox={setAddressBox}
            addressBox={addressBox}
          />
        );

      case "offers-setting":
        return (
          <Offer
            register={register}
            errors={errors}
            isSave={isSave}
            isSubmitting={isSubmitting}
            setOffersPageHeader={setOffersPageHeader}
            offersPageHeader={offersPageHeader}
            setOffersHeaderBg={setOffersHeaderBg}
            offersHeaderBg={offersHeaderBg}
            couponList1={couponList1}
            setCouponList1={setCouponList1}
            coupons={coupons}
          />
        );

      case "contact-us-setting":
        return (
          <ContactUs
            register={register}
            errors={errors}
            isSave={isSave}
            isSubmitting={isSubmitting}
            setContactPageHeader={setContactPageHeader}
            contactPageHeader={contactPageHeader}
            setContactHeaderBg={setContactHeaderBg}
            contactHeaderBg={contactHeaderBg}
            setContactFormStatus={setContactFormStatus}
            contactFormStatus={contactFormStatus}
            setContactMidLeftColStatus={setContactMidLeftColStatus}
            contactMidLeftColStatus={contactMidLeftColStatus}
            setContactMidLeftColImage={setContactMidLeftColImage}
            contactMidLeftColImage={contactMidLeftColImage}
          />
        );

      case "homepage-sections":
        return <HomepageSections />;

              case "shipping-settings":
          return <DistanceBasedShipping register={register} errors={errors} isSave={isSave} isSubmitting={isSubmitting} setValue={setValue} />;

      default:
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Store Customization</h2>
            <p className="text-gray-600">Select a tab to customize your store settings.</p>
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-12 font-sans">
      <div className="col-span-12 md:col-span-12 lg:col-span-12">
        <div className="rounded-md">
          <div className="bg-white dark:bg-gray-800 px-6 pt-6 rounded-md">
            <h1 className="mb-8 text-xl font-bold text-gray-700 dark:text-gray-300">
              {t("StoreCustomization")}
            </h1>

            {/* Tab Navigation */}
            <StoreTabList />

            {/* Tab Content */}
            <div className="pb-6">
              {(storeTab === "home-settings" ||
                storeTab === "single-setting" ||
                storeTab === "about-us-setting" ||
                storeTab === "privacy-setting" ||
                storeTab === "FAQ-setting" ||
                storeTab === "offers-setting" ||
                                 storeTab === "contact-us-setting" ||
                 storeTab === "shipping-settings") && (
                <form onSubmit={handleSubmit(onSubmit)}>
                  {renderTabContent()}
                </form>
              )}

              {storeTab === "homepage-sections" && renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreHome;
