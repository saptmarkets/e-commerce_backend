import React, { useContext, useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Badge,
  Button,
} from "@windmill/react-ui";
import { FiMapPin, FiTruck, FiRefreshCw, FiNavigation, FiUser } from "react-icons/fi";

import PageTitle from "../components/Typography/PageTitle";
import { SidebarContext } from "../context/SidebarContext";
import DeliveryServices from "../services/DeliveryServices";
import Loading from "../components/preloader/Loading";

const DeliveryTracking = () => {
  const { toggleDrawer } = useContext(SidebarContext);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const response = await DeliveryServices.getLiveTracking();
      console.log('Live Tracking API Response:', response);
      
      // Handle both direct response and wrapped response
      const responseData = response?.data || response;
      const deliveriesData = responseData?.deliveries || [];
      
      console.log('Processed Tracking Data:', deliveriesData);
      setActiveDeliveries(deliveriesData);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      setActiveDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTrackingData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Loading loading={loading} />;

  return (
    <>
      <PageTitle>Live Delivery Tracking</PageTitle>
      
      {/* Controls */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-lg font-semibold text-gray-700">
                Active Deliveries ({activeDeliveries.length})
              </h4>
              <p className="text-sm text-gray-500">
                Real-time tracking of ongoing deliveries
              </p>
            </div>
            <Button size="small" onClick={fetchTrackingData}>
              <FiRefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Tracking Grid */}
      {activeDeliveries.length === 0 ? (
        <Card>
          <CardBody className="text-center py-8">
            <FiTruck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Active Deliveries</h3>
            <p className="text-gray-500">All deliveries are completed or no orders are currently being delivered.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {activeDeliveries.map((delivery) => (
            <Card key={delivery._id}>
              <CardBody>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h5 className="font-medium text-gray-700">#{delivery.invoice}</h5>
                    <p className="text-sm text-gray-500">{delivery.customer.name}</p>
                  </div>
                  <Badge 
                    type={
                      delivery.status === 'Out for Delivery' ? 'warning' :
                      delivery.status === 'Processing' ? 'primary' : 'neutral'
                    }
                  >
                    {delivery.status}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <FiUser className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-600">Driver: {delivery.driver?.name}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FiTruck className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-600">
                      {delivery.driver?.vehicleType} - {delivery.driver?.vehicleNumber}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FiMapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-600">{delivery.customer.address}</span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Estimated Delivery:</span>
                    <span className="font-medium">
                      {delivery.estimatedDeliveryTime ? 
                        new Date(delivery.estimatedDeliveryTime).toLocaleTimeString() : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-gray-500">Distance:</span>
                    <span className="font-medium">{delivery.distance || 'N/A'}</span>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <Button 
                    size="small" 
                    layout="outline"
                    className="flex-1"
                    onClick={() => {
                      // Open Google Maps with driver location
                      if (delivery.driver?.currentLocation) {
                        const { latitude, longitude } = delivery.driver.currentLocation;
                        window.open(`https://maps.google.com/?q=${latitude},${longitude}`, '_blank');
                      }
                    }}
                  >
                    <FiNavigation className="w-3 h-3 mr-1" />
                    Track
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => window.location.href = `/order/${delivery._id}`}
                  >
                    View Order
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default DeliveryTracking; 