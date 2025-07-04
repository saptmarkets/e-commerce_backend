import { useSearchParams } from "next/navigation";
import useTranslation from "next-translate/useTranslation";

//internal imports
import Dashboard from "./dashboard";
import Error from "@components/form/Error";
import { countries } from "@utils/countries";
import InputArea from "@components/form/InputArea";
import SelectOption from "@components/form/SelectOption";
import useShippingAddressSubmit from "@hooks/useShippingAddressSubmit";

const AddShippingAddress = () => {
  const { t } = useTranslation('common');
  const id = useSearchParams().get("id");

  //   console.log("id", id);

  const {
    register,
    onSubmit,
    errors,
    cities,
    areas,
    handleSubmit,
    selectedValue,
    isSubmitting,
    handleInputChange,
  } = useShippingAddressSubmit(id);

  //   console.log("selectedValues", selectedValue);

  return (
    <Dashboard
      title={t('addShippingAddress')}
      description={t('addShippingAddress')}
    >
      <div className="max-w-screen-2xl">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h2 className="text-xl font-semibold mb-5">
                {t('addShippingAddress')}
              </h2>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mt-5 md:mt-0 md:col-span-2">
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
                          label={t('fullAddress')}
                          name="address"
                          type="text"
                          placeholder={t('fullAddress')}
                        />

                        <Error errorName={errors.address} />
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <InputArea
                          register={register}
                          label={t('phone')}
                          name="contact"
                          type="tel"
                          placeholder={t('phone')}
                        />

                        <Error errorName={errors.contact} />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <InputArea
                          register={register}
                          label={t('email')}
                          name="email"
                          type="tel"
                          placeholder={t('email')}
                          readOnly={true}
                        />

                        <Error errorName={errors.email} />
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <SelectOption
                          name="country"
                          label={t('country')}
                          //   register={register}
                          //   required={true}
                          //   setValue={setValue}
                          options={countries?.map((country) => country?.name)}
                          onChange={handleInputChange}
                          value={selectedValue?.country}
                        />
                        <Error errorName={errors.country} />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <SelectOption
                          name="city"
                          label={t('city')}
                          //   register={register}
                          //   required={true}
                          //   setValue={setValue}
                          options={cities?.map((city) => city?.name)}
                          onChange={handleInputChange}
                          value={selectedValue?.city}
                        />
                        <Error errorName={errors.city} />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <SelectOption
                          name="area"
                          label={t('area')}
                          options={areas?.map((area) => area)}
                          //   register={register}
                          //   required={true}
                          //   setValue={setValue}
                          onChange={handleInputChange}
                          value={selectedValue?.area}
                        />
                        <Error errorName={errors.area} />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <InputArea
                          register={register}
                          label={t('zipCode')}
                          name="zipCode"
                          type="text"
                          placeholder={t('zipCode')}
                          required={false}
                        />

                        <Error errorName={errors.zipCode} />
                      </div>
                    </div>
                    <div className="col-span-6 sm:col-span-3 mt-5 text-right">
                      {isSubmitting ? (
                        <button
                          disabled={isSubmitting}
                          type="submit"
                          className="cursor-progress md:text-sm leading-5 inline-flex items-center transition ease-in-out duration-300 font-medium text-center justify-center border-0 border-transparent rounded-md placeholder-white focus-visible:outline-none focus:outline-none bg-cyan-600 text-white px-5 md:px-6 lg:px-8 py-2 md:py-3 lg:py-3 hover:text-white hover:bg-cyan-700 h-12 mt-1 text-sm lg:text-sm w-full sm:w-auto"
                        >
                          <img
                            src="/loader/spinner.gif"
                            alt="Loading"
                            width={20}
                            height={10}
                          />
                          <span className=" ml-2 font-light">{t('processing')}</span>
                        </button>
                      ) : (
                        <button
                          disabled={isSubmitting}
                          type="submit"
                          className="md:text-sm leading-5 inline-flex items-center cursor-pointer transition ease-in-out duration-300 font-medium text-center justify-center border-0 border-transparent rounded-md placeholder-white focus-visible:outline-none focus:outline-none bg-cyan-600 text-white px-5 md:px-6 lg:px-8 py-2 md:py-3 lg:py-3 hover:text-white hover:bg-cyan-700 h-12 mt-1 text-sm lg:text-sm w-full sm:w-auto"
                        >
                          {t('addShippingAddress')}
                        </button>
                      )}
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

export default AddShippingAddress;
