import React, { useContext, useState } from "react";
import { Scrollbars } from "react-custom-scrollbars-2";
import { Card, CardBody, Input, WindmillContext, Select } from "@windmill/react-ui";
import { useTranslation } from "react-i18next";
import { MultiSelect } from "react-multi-select-component";

//internal import
import { routeAccessList } from "@/routes";
import useGetCData from "@/hooks/useGetCData";
import Error from "@/components/form/others/Error";
import Title from "@/components/form/others/Title";
import InputArea from "@/components/form/input/InputArea";
import useStaffSubmit from "@/hooks/useStaffSubmit";
import SelectRole from "@/components/form/selectOption/SelectRole";
import DrawerButton from "@/components/form/button/DrawerButton";
import LabelArea from "@/components/form/selectOption/LabelArea";
import Uploader from "@/components/image-uploader/Uploader";

const StaffDrawer = ({ id }) => {
  const { role } = useGetCData();
  const { mode } = useContext(WindmillContext);
  const [selectedRole, setSelectedRole] = useState(""); // Track selected role
  const {
    register,
    handleSubmit,
    onSubmit,
    errors,
    adminInfo,
    imageUrl,
    setImageUrl,
    isSubmitting,
    selectedDate,
    setSelectedDate,
    accessedRoutes,
    setAccessedRoutes,
    handleSelectLanguage,
  } = useStaffSubmit(id);
  const { t } = useTranslation();

  return (
    <>
      <div className="w-full relative p-6 border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        {id ? (
          <Title
            register={register}
            handleSelectLanguage={handleSelectLanguage}
            title={t("UpdateStaff")}
            description={t("UpdateStaffdescription")}
          />
        ) : (
          <Title
            register={register}
            handleSelectLanguage={handleSelectLanguage}
            title={t("AddStaffTitle")}
            description={t("AddStaffdescription")}
          />
        )}
      </div>
      <Scrollbars className="w-full md:w-7/12 lg:w-8/12 xl:w-8/12 relative dark:bg-gray-700 dark:text-gray-200">
        <Card className="overflow-y-scroll flex-grow scrollbar-hide w-full max-h-full">
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="px-6 pt-8 flex-grow scrollbar-hide w-full max-h-full pb-40">
                <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <LabelArea label="Staff Image" />
                  <div className="col-span-8 sm:col-span-4">
                    <Uploader
                      imageUrl={imageUrl}
                      setImageUrl={setImageUrl}
                      folder="admin"
                      targetWidth={238}
                      targetHeight={238}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <LabelArea label="Name" />
                  <div className="col-span-8 sm:col-span-4">
                    <InputArea
                      required={true}
                      register={register}
                      label="Name"
                      name="name"
                      type="text"
                      autoComplete="username"
                      placeholder="Staff name"
                    />
                    <Error errorName={errors.name} />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <LabelArea label="Email" />
                  <div className="col-span-8 sm:col-span-4">
                    <InputArea
                      required={true}
                      register={register}
                      label="Email"
                      name="email"
                      type="text"
                      autoComplete="username"
                      pattern={
                        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
                      }
                      placeholder="Email"
                    />
                    <Error errorName={errors.email} />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <LabelArea label="Password" />
                  <div className="col-span-8 sm:col-span-4">
                    {id ? (
                      <InputArea
                        register={register}
                        label="Password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Password"
                      />
                    ) : (
                      <InputArea
                        required={true}
                        register={register}
                        label="Password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Password"
                      />
                    )}

                    <Error errorName={errors.password} />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <LabelArea label="Contact Number" />
                  <div className="col-span-8 sm:col-span-4">
                    <InputArea
                      required={true}
                      register={register}
                      label="Contact Number"
                      name="phone"
                      pattern={/^[+]?\d*$/}
                      minLength={6}
                      maxLength={15}
                      type="text"
                      placeholder="Phone number"
                    />
                    <Error errorName={errors.phone} />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <LabelArea label="Joining Date" />
                  <div className="col-span-8 sm:col-span-4">
                    <Input
                      onChange={(e) => setSelectedDate(e.target.value)}
                      label="Joining Date"
                      name="joiningDate"
                      value={selectedDate}
                      type="date"
                      placeholder={t("StaffJoiningDate")}
                    />
                    <Error errorName={errors.joiningDate} />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <LabelArea label="Staff Role" />
                  <div className="col-span-8 sm:col-span-4">
                    <Select
                      name="role"
                      {...register("role", {
                        required: "Role is required!",
                        onChange: (e) => setSelectedRole(e.target.value),
                      })}
                    >
                      <option value="" defaultValue hidden>
                        Staff role
                      </option>
                      <option value="Super Admin">Super Admin</option>
                      <option value="Admin">Admin</option>
                      <option value="Cashier">Cashier</option>
                      <option value="CEO">CEO</option>
                      <option value="Manager">Manager</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Driver">Driver</option>
                      <option value="Security Guard">Security Guard</option>
                      <option value="Deliver Person">Delivery Person</option>
                    </Select>
                    <Error errorName={errors.role} />
                  </div>
                </div>

                {/* Delivery-specific fields for Driver role */}
                {selectedRole === "Driver" && (
                  <>
                    <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                      <LabelArea label="Vehicle Type" />
                      <div className="col-span-8 sm:col-span-4">
                        <Select
                          name="deliveryInfo.vehicleType"
                          {...register("deliveryInfo.vehicleType", {
                            required: selectedRole === "Driver" ? "Vehicle type is required for drivers!" : false,
                          })}
                          onChange={(e) => {
                            console.log("Vehicle type selected:", e.target.value);
                          }}
                        >
                          <option value="" defaultValue hidden>
                            Select vehicle type
                          </option>
                          <option value="bike">Bike</option>
                          <option value="car">Car</option>
                          <option value="van">Van</option>
                          <option value="scooter">Scooter</option>
                        </Select>
                        <Error errorName={errors.deliveryInfo?.vehicleType} />
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                      <LabelArea label="Vehicle Number" />
                      <div className="col-span-8 sm:col-span-4">
                        <InputArea
                          required={selectedRole === "Driver"}
                          register={register}
                          label="Vehicle Number"
                          name="deliveryInfo.vehicleNumber"
                          type="text"
                          placeholder="e.g., B-123-XYZ"
                        />
                        <Error errorName={errors.deliveryInfo?.vehicleNumber} />
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                      <LabelArea label="License Number" />
                      <div className="col-span-8 sm:col-span-4">
                        <InputArea
                          required={selectedRole === "Driver"}
                          register={register}
                          label="License Number"
                          name="deliveryInfo.licenseNumber"
                          type="text"
                          placeholder="e.g., DL12345678901"
                        />
                        <Error errorName={errors.deliveryInfo?.licenseNumber} />
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                      <LabelArea label="Driver Phone Number" />
                      <div className="col-span-8 sm:col-span-4">
                        <InputArea
                          required={selectedRole === "Driver"}
                          register={register}
                          label="Driver Phone Number"
                          name="deliveryInfo.phoneNumber"
                          pattern={/^[+]?\d*$/}
                          minLength={6}
                          maxLength={15}
                          type="text"
                          placeholder="Driver contact number"
                        />
                        <Error errorName={errors.deliveryInfo?.phoneNumber} />
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                      <LabelArea label="Emergency Contact Name" />
                      <div className="col-span-8 sm:col-span-4">
                        <InputArea
                          register={register}
                          label="Emergency Contact Name"
                          name="deliveryInfo.emergencyContact.name"
                          type="text"
                          placeholder="Emergency contact name"
                        />
                        <Error errorName={errors.deliveryInfo?.emergencyContact?.name} />
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                      <LabelArea label="Emergency Contact Phone" />
                      <div className="col-span-8 sm:col-span-4">
                        <InputArea
                          register={register}
                          label="Emergency Contact Phone"
                          name="deliveryInfo.emergencyContact.phone"
                          pattern={/^[+]?\d*$/}
                          minLength={6}
                          maxLength={15}
                          type="text"
                          placeholder="Emergency contact phone"
                        />
                        <Error errorName={errors.deliveryInfo?.emergencyContact?.phone} />
                      </div>
                    </div>
                  </>
                )}
                {(role === "Admin" || role === "Super Admin") && (
                  <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                    <LabelArea label="Select Routes to given Access" />
                    <div className="col-span-8 sm:col-span-4">
                      <MultiSelect
                        options={routeAccessList}
                        value={accessedRoutes}
                        className={mode}
                        onChange={(v) => setAccessedRoutes(v)}
                        labelledBy="Select Routes"
                      />
                      {selectedRole === "Driver" && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-800 font-semibold mb-2">📋 Recommended Routes for Drivers:</p>
                          <div className="text-xs text-blue-700 space-y-1">
                            <div>✅ <strong>Dashboard</strong> - View performance stats and daily summary</div>
                            <div>✅ <strong>Products</strong> - Verify items during pickup</div>
                            <div>✅ <strong>Orders</strong> - View assigned orders and customer details</div>
                            <div>✅ <strong>Customers</strong> - Access customer information for delivery</div>
                            <div>✅ <strong>Edit Profile</strong> - Update personal and vehicle information</div>
                            <div className="mt-2 text-blue-600">
                              <strong>💡 Quick Setup:</strong> Click the button below to auto-select driver routes
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const driverRoutes = [
                                { label: "Dashboard", value: "dashboard" },
                                { label: "Products", value: "products" },
                                { label: "Orders", value: "orders" },
                                { label: "Customers", value: "customers" },
                                { label: "Edit Profile", value: "edit-profile" }
                              ];
                              setAccessedRoutes(driverRoutes);
                            }}
                            className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            🚀 Auto-Select Driver Routes
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DrawerButton
                id={id}
                title="Staff"
                zIndex="z-5"
                isSubmitting={isSubmitting}
              />
            </form>
          </CardBody>
        </Card>
      </Scrollbars>
    </>
  );
};

export default StaffDrawer;
