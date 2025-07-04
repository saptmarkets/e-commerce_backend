import React, { useContext, useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Label,
  Select,
} from "@windmill/react-ui";
import { FiSettings, FiSave, FiRefreshCw } from "react-icons/fi";

import PageTitle from "../components/Typography/PageTitle";
import { SidebarContext } from "../context/SidebarContext";
import DeliveryServices from "../services/DeliveryServices";
import Loading from "../components/preloader/Loading";

const DeliverySettings = () => {
  const { toggleDrawer } = useContext(SidebarContext);
  const [settings, setSettings] = useState({
    autoAssignEnabled: false,
    maxOrdersPerDriver: 5,
    deliveryRadius: 10,
    workingHours: {
      start: "09:00",
      end: "21:00"
    },
    prioritySettings: {
      urgent: { maxWaitTime: 15 },
      high: { maxWaitTime: 30 },
      medium: { maxWaitTime: 60 },
      low: { maxWaitTime: 120 }
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching delivery settings...');
      const response = await DeliveryServices.getDeliverySettings();
      console.log('📥 Response from httpService:', response);
      console.log('📥 Response type:', typeof response);
      console.log('📥 Response keys:', response && typeof response === 'object' ? Object.keys(response) : 'not an object');
      
      // Since httpService processes the response, 'response' is actually the data
      // The backend returns { settings: {...} }, so we need response.settings
      const fetchedSettings = response?.settings;
      console.log('🔍 Extracted settings:', fetchedSettings);
      
      if (fetchedSettings && typeof fetchedSettings === 'object') {
        console.log('✅ Setting fetched settings:', fetchedSettings);
        setSettings(fetchedSettings);
      } else {
        console.log('❌ No valid settings found, keeping defaults');
        console.log('❌ Expected response.settings to contain the settings object');
      }
    } catch (error) {
      console.error('❌ Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      console.log('💾 Saving settings:', settings);
      await DeliveryServices.updateDeliverySettings(settings);
      console.log('✅ Settings saved successfully!');
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent, field, value) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handlePriorityChange = (priority, field, value) => {
    setSettings(prev => ({
      ...prev,
      prioritySettings: {
        ...prev.prioritySettings,
        [priority]: {
          ...prev.prioritySettings[priority],
          [field]: parseInt(value)
        }
      }
    }));
  };

  if (loading) return <Loading loading={loading} />;

  return (
    <>
      <PageTitle>Delivery Settings</PageTitle>
      
      {/* General Settings */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-semibold text-gray-700">General Settings</h4>
            <div className="flex space-x-2">
              <Button size="small" layout="outline" onClick={fetchSettings}>
                <FiRefreshCw className="w-4 h-4 mr-1" />
                Reset
              </Button>
              <Button size="small" onClick={handleSaveSettings} disabled={saving}>
                <FiSave className="w-4 h-4 mr-1" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Auto Assignment */}
            <div>
              <Label className="mb-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.autoAssignEnabled}
                    onChange={(e) => handleInputChange('autoAssignEnabled', e.target.checked)}
                    className="mr-2"
                  />
                  <span>Enable Auto-Assignment</span>
                </div>
              </Label>
              <p className="text-sm text-gray-500">
                Automatically assign new orders to available drivers
              </p>
            </div>

            {/* Max Orders Per Driver */}
            <div>
              <Label>
                <span>Max Orders Per Driver</span>
                <Input
                  type="number"
                  value={settings.maxOrdersPerDriver}
                  onChange={(e) => handleInputChange('maxOrdersPerDriver', parseInt(e.target.value))}
                  min="1"
                  max="20"
                  className="mt-1"
                />
              </Label>
              <p className="text-sm text-gray-500">
                Maximum number of active orders per driver
              </p>
            </div>

            {/* Delivery Radius */}
            <div>
              <Label>
                <span>Delivery Radius (km)</span>
                <Input
                  type="number"
                  value={settings.deliveryRadius}
                  onChange={(e) => handleInputChange('deliveryRadius', parseInt(e.target.value))}
                  min="1"
                  max="50"
                  className="mt-1"
                />
              </Label>
              <p className="text-sm text-gray-500">
                Maximum delivery distance from store
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Working Hours */}
      <Card className="mb-6">
        <CardBody>
          <h4 className="text-lg font-semibold text-gray-700 mb-4">Working Hours</h4>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label>
                <span>Start Time</span>
                <Input
                  type="time"
                  value={settings.workingHours.start}
                  onChange={(e) => handleNestedInputChange('workingHours', 'start', e.target.value)}
                  className="mt-1"
                />
              </Label>
            </div>

            <div>
              <Label>
                <span>End Time</span>
                <Input
                  type="time"
                  value={settings.workingHours.end}
                  onChange={(e) => handleNestedInputChange('workingHours', 'end', e.target.value)}
                  className="mt-1"
                />
              </Label>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Priority Settings */}
      <Card>
        <CardBody>
          <h4 className="text-lg font-semibold text-gray-700 mb-4">Priority Settings</h4>
          <p className="text-sm text-gray-500 mb-6">
            Maximum wait time (in minutes) for each priority level before escalation
          </p>
          
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Object.entries(settings.prioritySettings).map(([priority, config]) => (
              <div key={priority}>
                <Label>
                  <span className="capitalize font-medium">{priority} Priority</span>
                  <div className="flex items-center mt-1">
                    <Input
                      type="number"
                      value={config.maxWaitTime}
                      onChange={(e) => handlePriorityChange(priority, 'maxWaitTime', e.target.value)}
                      min="5"
                      max="300"
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-500">min</span>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving}>
          <FiSave className="w-4 h-4 mr-2" />
          {saving ? 'Saving Settings...' : 'Save All Settings'}
        </Button>
      </div>
    </>
  );
};

export default DeliverySettings; 