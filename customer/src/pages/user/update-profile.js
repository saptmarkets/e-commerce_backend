import { useForm } from "react-hook-form";
import React, { useEffect, useState, useRef } from "react";
import useTranslation from "next-translate/useTranslation";

//internal import
import Label from "@components/form/Label";
import Error from "@components/form/Error";
import Dashboard from "./dashboard";
import InputArea from "@components/form/InputArea";
import SelectOption from "@components/form/SelectOption";
import useGetSetting from "@hooks/useGetSetting";
import CustomerServices from "@services/CustomerServices";
import Uploader from "@components/image-uploader/Uploader";
import { notifySuccess, notifyError } from "@utils/toast";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { countries } from "@utils/countries";
import LocationService from "@components/location/LocationService";
import { getUserSession } from "@lib/auth";
import Cookies from "js-cookie";

const UpdateProfile = () => {
  const { t } = useTranslation('common');
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedValue, setSelectedValue] = useState({
    country: "",
    city: "",
    area: "",
  });
  const [userLocation, setUserLocation] = useState(null);
  const initialValuesSet = useRef(false);
  // State to manage the selected location input option (gps or manual)
  const [selectedLocationInputOption, setSelectedLocationInputOption] = useState('gps');
  
  // Get user session from cookies
  const userInfo = getUserSession();
  const { storeCustomizationSetting } = useGetSetting();
  const { showingTranslateValue } = useUtilsFunction();

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: userInfo?.email || "",
    }
  });

  // Watch the address field to make it reactive
  const watchedAddress = watch("address");

  const handleLocationUpdate = async (locationData) => {
    console.log('📍 Location updated:', locationData);
    setUserLocation(locationData);
        
    // Auto-fill address if location is detected
    if (locationData?.address) {
      console.log('🏠 Setting address:', locationData.address);
      setValue('address', locationData.address, { 
        shouldValidate: true, 
        shouldDirty: true,
        shouldTouch: true 
      });
      // Trigger validation to force re-render
      await trigger('address');
    } else {
      console.log('⚠️ No address in location data');
    }
    
    // Auto-fill city if detected
    if (locationData?.city) {
      console.log('🏙️ Setting city:', locationData.city);
      setValue('city', locationData.city, { 
        shouldValidate: true, 
        shouldDirty: true,
        shouldTouch: true 
      });
      setSelectedValue(prev => ({
        ...prev,
        city: locationData.city
      }));
      await trigger('city');
    } else if (locationData?.addressComponents?.city) {
      console.log('🏙️ Setting city from addressComponents:', locationData.addressComponents.city);
      setValue('city', locationData.addressComponents.city, { 
        shouldValidate: true, 
        shouldDirty: true,
        shouldTouch: true 
      });
      setSelectedValue(prev => ({
        ...prev,
        city: locationData.addressComponents.city
      }));
      await trigger('city');
    }
  };

  const handleInputChange = (name, value) => {
    setSelectedValue((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    
    if (name === "country") {
      const result = countries?.find(
        (country) => country?.name === value
      )?.cities || [];
      setCities(result);
      setAreas([]);
    }
    
    if (name === "city") {
      const result = cities?.find((city) => city?.name === value)?.areas || [];
      setAreas(result);
    }
  };

  const onSubmit = async (data) => {
    if (!userInfo?.id) {
      notifyError("User session not found, please try again.");
      return;
    }

    setLoading(true);

    const userData = {
      name: data.name,
      address: data.address,
      phone: data.phone,
      country: selectedValue.country,
      city: selectedValue.city,
      area: selectedValue.area,
      image: imageUrl,
      latitude: userLocation?.latitude || userInfo?.latitude || "",
      longitude: userLocation?.longitude || userInfo?.longitude || "",
    };
    
    try {
      const res = await CustomerServices.updateCustomer(
        userInfo.id,
        userData
      );
      setLoading(false);
      
      // Update user info in cookies
      const updatedUserInfo = {
        ...userInfo,
        name: data.name,
        address: data.address,
        phone: data.phone,
        country: selectedValue.country,
        city: selectedValue.city,
        area: selectedValue.area,
        image: imageUrl,
        latitude: userLocation?.latitude || userInfo?.latitude || "",
        longitude: userLocation?.longitude || userInfo?.longitude || "",
      };
      
      Cookies.set('userInfo', JSON.stringify(updatedUserInfo), {
        expires: 7,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax"
      });
      
      notifySuccess(t("profileUpdated"));
    } catch (error) {
      setLoading(false);
      notifyError(error?.response?.data?.message || error?.message);
    }
  };

  useEffect(() => {
    if (userInfo && !initialValuesSet.current) {
      initialValuesSet.current = true;
      
      setValue("name", userInfo?.name || "");
      setValue("email", userInfo?.email || "");
      setValue("address", userInfo?.address || "");
      setValue("phone", userInfo?.phone || "");
      setImageUrl(userInfo?.image || "");
      
      // Set existing country/city/area if available
      if (userInfo?.country) {
        setSelectedValue(prev => ({
          ...prev,
          country: userInfo.country,
          city: userInfo.city || "",
          area: userInfo.area || ""
        }));
        
        // Load cities for existing country
        const result = countries?.find(
          (country) => country?.name === userInfo.country
        )?.cities || [];
        setCities(result);
        
        // Load areas for existing city
        if (userInfo.city) {
          const areaResult = result?.find((city) => city?.name === userInfo.city)?.areas || [];
          setAreas(areaResult);
        }
      }

      // Initialize userLocation with existing coordinates if available
      const existingLat = userInfo.latitude || userInfo.lat || userInfo.coords?.latitude;
      const existingLng = userInfo.longitude || userInfo.lng || userInfo.coords?.longitude;

      if (existingLat && existingLng) {
        setUserLocation({
          latitude: parseFloat(existingLat),
          longitude: parseFloat(existingLng),
          accuracy: 0, // Assuming 0 accuracy for saved data, as it's not live GPS
          timestamp: Date.now()
        });
        console.log("Initialized userLocation from userInfo:", { lat: existingLat, lng: existingLng });
      }
    }
  }, [userInfo]); // Removed setValue from dependencies

  return (
    <Dashboard
      title={showingTranslateValue(
        storeCustomizationSetting?.dashboard?.update_profile
      )}
      description={t('updateProfilePageDescription')}
    >
      <div className="max-w-screen-2xl">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h2 className="text-xl font-serif font-semibold mb-5">
                {showingTranslateValue(
                  storeCustomizationSetting?.dashboard?.update_profile
                )}
              </h2>
              <p className="mt-1 text-sm text-gray-600">{t('profileMainPageEdit')}</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <div className="bg-white space-y-6">
              <div>
                <Label label={t('profilePhoto')} />
                <div className="mt-1 flex items-center">
                  <Uploader imageUrl={imageUrl} setImageUrl={setImageUrl} />
                </div>
              </div>
            </div>

            <div className="mt-10 sm:mt-0">
              <div className="md:grid-cols-6 md:gap-6">
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="lg:mt-6 mt-4 bg-white">
                    <div className="grid grid-cols-6 gap-6">
                      <div className="col-span-6 sm:col-span-3">
                        <InputArea
                          register={register}
                          label={t('fullName')}
                          name="name"
                          type="text"
                          placeholder={t('fullName')}
                        />
                        <Error errorName={errors.name} />
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <InputArea
                          register={register}
                          label={t('phoneNumber')}
                          name="phone"
                          type="tel"
                          placeholder="+966-5xxxxxxxx"
                        />
                        <Error errorName={errors.phone} />
                      </div>

                      <div className="col-span-6">
                        <Label label={t('emailAddress')} />
                        <input
                          type="email"
                          name="email"
                          readOnly={true}
                          disabled={true}
                          value={userInfo?.email || ""}
                          placeholder={t('emailAddress')}
                          className={`py-2 px-4 md:px-5 w-full appearance-none border text-sm opacity-75 text-input rounded-md placeholder-body min-h-12 transition duration-200 focus:ring-0 ease-in-out bg-gray-100 border-gray-200 focus:outline-none focus:border-emerald-500 h-11 md:h-12 cursor-not-allowed text-gray-500`}
                        />
                      </div>

                      {/* Country Selection */}
                      <div className="col-span-6 sm:col-span-2">
                        <SelectOption
                          name="country"
                          label={t('country')}
                          options={countries?.map((country) => country?.name)}
                          onChange={handleInputChange}
                          value={selectedValue?.country}
                        />
                        <Error errorName={errors.country} />
                      </div>

                      {/* City Selection */}
                      <div className="col-span-6 sm:col-span-2">
                        <SelectOption
                          name="city"
                          label={t('city')}
                          options={cities?.map((city) => city?.name)}
                          onChange={handleInputChange}
                          value={selectedValue?.city}
                          disabled={!selectedValue?.country}
                        />
                        <Error errorName={errors.city} />
                      </div>

                      {/* Area Selection */}
                      <div className="col-span-6 sm:col-span-2">
                        <SelectOption
                          name="area"
                          label={t('area')}
                          options={areas}
                          onChange={handleInputChange}
                          value={selectedValue?.area}
                          disabled={!selectedValue?.city}
                        />
                        <Error errorName={errors.area} />
                      </div>

                      {/* Location Service - Same as Checkout */}
                      <div className="col-span-6">
                        <Label label={t('locationService')} />
                        <div className="mb-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Option 1: Get Current Location (GPS) */}
                            <button
                              type="button"
                              onClick={() => setSelectedLocationInputOption('gps')}
                              className={`p-4 border-2 rounded-lg text-center transition-all ${
                                selectedLocationInputOption === 'gps'
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              <div className="text-3xl mb-2">📱</div>
                              <div className="font-semibold text-sm">{t('detectCurrentLocation')}</div>
                              <div className="text-xs mt-1 opacity-75">{t('useDeviceGPS')}</div>
                            </button>

                            {/* Option 2: Manual Entry */}
                            <button
                              type="button"
                              onClick={() => setSelectedLocationInputOption('manual')}
                              className={`p-4 border-2 rounded-lg text-center transition-all ${
                                selectedLocationInputOption === 'manual'
                                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              <div className="text-3xl mb-2">🗺️</div>
                              <div className="font-semibold text-sm">{t('enterCoordinatesManually')}</div>
                              <div className="text-xs mt-1 opacity-75">{t('latitude')}, {t('longitude')}</div>
                            </button>
                          </div>

                          {/* Dynamic Location Input Area */}
                          {selectedLocationInputOption === 'gps' && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                📍 {t('gpsLocationDetection')}
                              </h3>
                              <LocationService
                                onLocationUpdate={handleLocationUpdate}
                                className="w-full"
                                initialLocation={userLocation} // Pass existing userLocation to LocationService
                              />
                               {userLocation && (
                                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                                    <div className="text-sm font-medium text-green-800 mb-1">✅ {t('locationDetected')}</div>
                                    <div className="text-xs text-green-600">
                                      {t('latitude')}: {userLocation.latitude?.toFixed(6)}<br/>
                                      {t('longitude')}: {userLocation.longitude?.toFixed(6)}
                                    </div>
                                    {userLocation.address && (
                                      <div className="text-xs text-green-600 mt-1">
                                        {t('address')}: {userLocation.address}
                                      </div>
                                    )}
                                    <a
                                      href={`https://maps.google.com?q=${userLocation.latitude},${userLocation.longitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-block mt-2 text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                                    >
                                      🗺️ {t('viewOnMaps')}
                                    </a>
                                  </div>
                                )}
                            </div>
                          )}

                          {selectedLocationInputOption === 'manual' && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                📍 {t('enterCoordinatesManually')}
                              </h3>
                              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-4">
                                <div className="text-sm font-medium text-orange-800 mb-2">📍 {t('howToGetExactCoordinates')}:</div>
                                <div className="text-xs text-orange-700 space-y-2">
                                  <div className="flex items-start">
                                    <span className="mr-2">1.</span>
                                    <div>
                                      <strong>{t('openGoogleMaps')}</strong> {t('onYourPhoneOrComputer')}<br/>
                                      <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                        🔗 maps.google.com
                                      </a>
                                    </div>
                                  </div>
                                  <div className="flex items-start">
                                    <span className="mr-2">2.</span>
                                    <div><strong>{t('findYourLocation')}</strong> {t('onTheMap')}</div>
                                  </div>
                                  <div className="flex items-start">
                                    <span className="mr-2">3.</span>
                                    <div><strong>{t('rightClickOrPressAndHold')}</strong> {t('onTheExactSpot')}</div>
                                  </div>
                                  <div className="flex items-start">
                                    <span className="mr-2">4.</span>
                                    <div><strong>{t('copyTheCoordinates')}</strong> {t('thatAppearExample')}</div>
                                  </div>
                                  <div className="flex items-start">
                                    <span className="mr-2">5.</span>
                                    <div><strong>{t('pasteThemBelow')}</strong> {t('andClickSetCoordinates')}</div>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                  <InputArea
                                    register={register}
                                    label={t('latitude')}
                                    name="latitude"
                                    type="number"
                                    step="any"
                                    placeholder="24.7136"
                                    onChange={(e) => setUserLocation(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                                    value={userLocation?.latitude || ''}
                                  />
                                </div>
                                <div className="col-span-6 sm:col-span-3">
                                  <InputArea
                                    register={register}
                                    label={t('longitude')}
                                    name="longitude"
                                    type="number"
                                    step="any"
                                    placeholder="46.6753"
                                    onChange={(e) => setUserLocation(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                                    value={userLocation?.longitude || ''}
                                  />
                                </div>
                              </div>

                              <div className="mt-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setValue('address', '', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                                    if (userLocation?.latitude && userLocation?.longitude) {
                                      notifySuccess(t('coordinatesSetSuccessfully'));
                                    } else {
                                      notifyError(t('pleaseEnterValidCoordinates'));
                                    }
                                  }}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  {t('setCoordinates')}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-span-6">
                        <InputArea
                          register={register}
                          label={t('address')}
                          name="address"
                          type="text"
                          placeholder={t('fullAddress')}
                        />
                        <Error errorName={errors.address} />
                      </div>

                      <div className="col-span-6 sm:col-end-7">
                        <div className="text-right">
                          <button
                            type="submit"
                            disabled={loading}
                            className="md:text-sm leading-5 inline-flex items-center cursor-pointer transition ease-in-out duration-300 font-medium text-center justify-center border-0 border-transparent rounded-md focus:outline-none bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2"
                          >
                            {loading ? t('submitting') : t('updateProfile')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Dashboard>
  );
};

export default UpdateProfile;
