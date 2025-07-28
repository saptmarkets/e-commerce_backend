import { Button } from "@windmill/react-ui";
import { useTranslation } from "react-i18next";
import { FiSettings } from "react-icons/fi";
import {
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tabs as TabsComponent,
} from "react-tabs";

//internal import

import Error from "@/components/form/others/Error";
import spinnerLoadingImage from "@/assets/img/spinner.gif";
import InputAreaTwo from "@/components/form/input/InputAreaTwo";
import SwitchToggle from "@/components/form/switch/SwitchToggle";
import TextAreaCom from "@/components/form/others/TextAreaCom";
import UploaderWithCropper from "@/components/image-uploader/UploaderWithCropper";
import SelectLanguageTwo from "@/components/form/selectOption/SelectLanguageTwo";
import { useState, useContext } from "react";
import { SidebarContext } from "@/context/SidebarContext";

const AboutUs = ({
  isSave,
  register,
  errors,
  control,
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
  // Section toggles
  setAboutCoreValues,
  aboutCoreValues,
  setAboutBranches,
  aboutBranches,
  isSubmitting,
  handleSubmit,
  onSubmit,
  handleSelectLanguage,
}) => {
  const { t } = useTranslation();
  const { lang } = useContext(SidebarContext);
  const [selectedLanguage, setSelectedLanguage] = useState(lang || "en");

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    // Call the parent's handleSelectLanguage function
    if (handleSelectLanguage) {
      handleSelectLanguage(language);
    }
    console.log('Language changed to:', language);
  };

  return (
    <>
      <div className="grid grid-cols-12 font-sans pr-4">
        <div className="col-span-12 md:col-span-12 lg:col-span-12">
          <div className="sticky top-0 z-20 flex justify-end">
            {isSubmitting ? (
              <Button disabled={true} type="button" className="h-10 px-6">
                <img
                  src={spinnerLoadingImage}
                  alt="Loading"
                  width={20}
                  height={10}
                />{" "}
                <span className="font-serif ml-2 font-light">
                  {" "}
                  {t("Processing")}
                </span>
              </Button>
            ) : (
              <Button
                type="submit"
                className="h-10 px-6 "
                onClick={(e) => {
                  e.preventDefault(); // Prevent default form submission
                  console.log('=== ABOUT US FORM DEBUG ===');
                  console.log('Button clicked!');
                  console.log('Form errors:', errors);
                  console.log('isSubmitting:', isSubmitting);
                  console.log('isSave:', isSave);
                  
                  // Try to submit the form programmatically
                  console.log('Attempting programmatic form submission...');
                  
                  // Get the form element
                  const form = e.target.closest('form');
                  console.log('Form element:', form);
                  
                  if (form) {
                    // Trigger form submission
                    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                    form.dispatchEvent(submitEvent);
                    console.log('Form submit event dispatched');
                  } else {
                    console.log('No form element found');
                  }
                  
                  // Fallback: Try direct onSubmit call
                  setTimeout(() => {
                    console.log('Trying direct onSubmit call as fallback...');
                    try {
                      // Get form data manually
                      const formData = new FormData(form);
                      const data = {};
                      for (let [key, value] of formData.entries()) {
                        data[key] = value;
                      }
                      console.log('Form data:', data);
                      
                      // Call onSubmit directly
                      onSubmit(data);
                    } catch (error) {
                      console.error('Error in direct onSubmit call:', error);
                    }
                  }, 100);
                }}
              >
                {isSave ? t("SaveBtn") : t("UpdateBtn")}
              </Button>
            )}
          </div>

          <div className="inline-flex md:text-lg text-base text-gray-800 font-semibold dark:text-gray-400 md:mb-3 mb-1">
            <FiSettings className="mt-1 mr-2" />
            {t("AboutUs")}
          </div>

          {/* Language Selector */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Current Language: <span className="font-semibold">{selectedLanguage.toUpperCase()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Edit Language:</span>
              <SelectLanguageTwo 
                handleSelectLanguage={handleLanguageChange}
                register={() => ({})}
              />
            </div>
          </div>

          <hr className="md:mb-12 mb-3" />

          <div className="xl:px-10 flex-grow scrollbar-hide w-full max-h-full">
            <div className="inline-flex md:text-base text-sm mb-3 text-gray-500 dark:text-gray-400">
              <strong>{t("PageHeader")}</strong>
            </div>
            <hr className="md:mb-12 mb-3" />

            <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
              <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                {t("EnableThisBlock")}
              </label>
              <div className="sm:col-span-4">
                <SwitchToggle
                  title=""
                  handleProcess={setAboutPageHeader}
                  processOption={aboutPageHeader}
                  name={aboutPageHeader}
                />
              </div>
            </div>

            <div
              className="mb-height-0"
              style={{
                height: aboutPageHeader ? "auto" : 0,
                transition: "all 0.5s",
                visibility: !aboutPageHeader ? "hidden" : "visible",
                opacity: !aboutPageHeader ? "0" : "1",
              }}
            >
              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  {t("PageHeaderBg")}
                </label>
                <div className="sm:col-span-4">
                  <UploaderWithCropper
                    imageUrl={aboutHeaderBg}
                    setImageUrl={setAboutHeaderBg}
                    targetWidth={1920}
                    targetHeight={600}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  {t("PageTitle")}
                </label>
                <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                    label="Page Title"
                    name="about_page_title"
                    type="text"
                    placeholder={t("PageTitle")}
                  />
                  <Error errorName={errors.about_page_title} />
                </div>
              </div>

              {/* Hero Description */}
              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  {t("HeroDescription")}
                </label>
                <div className="sm:col-span-4">
                  <TextAreaCom
                    register={register}
                    label="Hero Description"
                    name="about_page_hero_description"
                    placeholder="Learn more about SAPT Markets and our story..."
                  />
                  <Error errorName={errors.about_page_hero_description} />
                </div>
              </div>
            </div>

            {/* Top Content Section */}
            <div className="inline-flex md:text-base text-sm mb-3 mt-5 text-gray-500 dark:text-gray-400">
              <strong>Top Content Section</strong>
            </div>
            <hr className="md:mb-12 mb-3" />

            <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
              <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                Show Top Section
              </label>
              <div className="sm:col-span-4">
                <SwitchToggle
                  title=""
                  handleProcess={setAboutTopContentLeft}
                  processOption={aboutTopContentLeft}
                  name={aboutTopContentLeft}
                />
              </div>
            </div>

            <div
              className="mb-height-0"
              style={{
                height: aboutTopContentLeft ? "auto" : 0,
                transition: "all 0.5s",
                visibility: !aboutTopContentLeft ? "hidden" : "visible",
                opacity: !aboutTopContentLeft ? "0" : "1",
              }}
            >
              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Top Section Title
                </label>
                <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                    label="Top Section Title"
                    name="about_page_top_section_title"
                    type="text"
                    placeholder="A Trusted Name in Qassim Retail"
                  />
                  <Error errorName={errors.about_page_top_section_title} />
                </div>
              </div>

              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Top Section Description
                </label>
                <div className="sm:col-span-4">
                  <TextAreaCom
                    register={register}
                    label="Top Section Description"
                    name="about_page_top_section_description"
                    placeholder="At SAPT Markets, we've built our reputation on providing quality products..."
                  />
                  <Error errorName={errors.about_page_top_section_description} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6 mt-8">
                {/* Badge Line 1 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Trusted Badge 1 Pill (e.g., Since 1989)
                  </label>
                  <InputAreaTwo
                    register={register}
                    label="Badge 1 Pill"
                    name="about_page_trusted_badge_one_pill"
                    type="text"
                    placeholder="Since 1989"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Trusted Badge 1 Text (e.g., From Family Business)
                  </label>
                  <InputAreaTwo
                    register={register}
                    label="Badge 1 Text"
                    name="about_page_trusted_badge_one_text"
                    type="text"
                    placeholder="From Family Business"
                  />
                </div>

                {/* Badge Line 2 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Trusted Badge 2 Pill (e.g., 35+ Years)
                  </label>
                  <InputAreaTwo
                    register={register}
                    label="Badge 2 Pill"
                    name="about_page_trusted_badge_two_pill"
                    type="text"
                    placeholder="35+ Years"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Trusted Badge 2 Text (e.g., Serving the Community)
                  </label>
                  <InputAreaTwo
                    register={register}
                    label="Badge 2 Text"
                    name="about_page_trusted_badge_two_text"
                    type="text"
                    placeholder="Serving the Community"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Top Section Image
                </label>
                <div className="sm:col-span-4">
                  <UploaderWithCropper
                    imageUrl={aboutTopContentRightImage}
                    setImageUrl={setAboutTopContentRightImage}
                    targetWidth={1050}
                    targetHeight={805}
                  />
                </div>
              </div>

              {/* Card One */}
              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Card One Title
                </label>
                <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                    label="Card One Title"
                    name="about_page_card_one_title"
                    type="text"
                    placeholder="Everyday Essentials"
                  />
                  <Error errorName={errors.about_page_card_one_title} />
                </div>
              </div>

              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Card One Subtitle
                </label>
                <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                    label="Card One Subtitle"
                    name="about_page_card_one_subtitle"
                    type="text"
                    placeholder="From Pantry to Home"
                  />
                  <Error errorName={errors.about_page_card_one_subtitle} />
                </div>
              </div>

              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Card One Description
                </label>
                <div className="sm:col-span-4">
                  <TextAreaCom
                    register={register}
                    label="Card One Description"
                    name="about_page_card_one_description"
                    type="text"
                    placeholder="We offer a comprehensive range of household necessities..."
                  />
                  <Error
                    errorName={errors.about_page_card_one_description}
                  />
                </div>
              </div>

              {/* Card Two */}
              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Card Two Title
                </label>
                <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                    label="Card Two Title"
                    name="about_page_card_two_title"
                    type="text"
                    placeholder="Weekly Offers"
                  />
                  <Error errorName={errors.about_page_card_two_title} />
                </div>
              </div>

              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Card Two Subtitle
                </label>
                <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                    label="Card Two Subtitle"
                    name="about_page_card_two_subtitle"
                    type="text"
                    placeholder="Save More, Shop Smart"
                  />
                  <Error errorName={errors.about_page_card_two_subtitle} />
                </div>
              </div>

              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Card Two Description
                </label>
                <div className="sm:col-span-4">
                  <TextAreaCom
                    register={register}
                    label="Card Two Description"
                    name="about_page_card_two_description"
                    type="text"
                    placeholder="Our regular promotional offers help families save money..."
                  />
                  <Error
                    errorName={errors.about_page_card_two_description}
                  />
                </div>
              </div>
            </div>

            <div className="inline-flex md:text-base text-sm mb-3 md:mt-5 text-gray-500 dark:text-gray-400 ">
              <strong>{t("PageTopContentRight")}</strong>
            </div>
            <hr className="md:mb-12 mb-3" />
            <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
              <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                {t("EnableThisBlock")}
              </label>
              <div className="sm:col-span-4">
                <SwitchToggle
                  title=""
                  handleProcess={setAboutTopContentRight}
                  processOption={aboutTopContentRight}
                  name={aboutTopContentRight}
                />
              </div>
            </div>

            <div
              style={{
                height: aboutTopContentRight ? "auto" : 0,
                transition: "all 0.5s",
                visibility: !aboutTopContentRight ? "hidden" : "visible",
                opacity: !aboutTopContentRight ? "0" : "1",
              }}
              className="mb-height-0 grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative"
            >
              <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                {t("TopContentRightImage")}
              </label>
              <div className="sm:col-span-4">
                <UploaderWithCropper
                  imageUrl={aboutTopContentRightImage}
                  setImageUrl={setAboutTopContentRightImage}
                  targetWidth={1050}
                  targetHeight={805}
                />
              </div>
            </div>

            {/* Heritage Section */}
            <div className="inline-flex md:text-base text-sm mb-3 md:mt-5 text-gray-500 dark:text-gray-400 relative ">
              <strong>Heritage Section</strong>
            </div>
            <hr className="md:mb-12 mb-3" />
            <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
              <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                Show Heritage Section
              </label>
              <div className="sm:col-span-4">
                <SwitchToggle
                  title=""
                  handleProcess={setAboutMiddleContentSection}
                  processOption={aboutMiddleContentSection}
                  name={aboutMiddleContentSection}
                />
              </div>
            </div>

            <div
              className="mb-height-0"
              style={{
                height: aboutMiddleContentSection ? "auto" : 0,
                transition: "all 0.5s",
                visibility: !aboutMiddleContentSection ? "hidden" : "visible",
                opacity: !aboutMiddleContentSection ? "0" : "1",
              }}
            >
              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Heritage Title
                </label>
                <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                    label="Heritage Title"
                    name="about_page_heritage_title"
                    type="text"
                    placeholder="Our Heritage & Vision"
                  />
                  <Error errorName={errors.about_page_heritage_title} />
                </div>
              </div>

              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Heritage Description One
                </label>
                <div className="sm:col-span-4">
                  <TextAreaCom
                    register={register}
                    label="Heritage Description One"
                    name="about_page_heritage_description_one"
                    placeholder="SAPT Markets is proudly part of the Al-Muhaysini Holding family..."
                  />
                  <Error errorName={errors.about_page_heritage_description_one} />
                </div>
              </div>

              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Heritage Description Two
                </label>
                <div className="sm:col-span-4">
                  <TextAreaCom
                    register={register}
                    label="Heritage Description Two"
                    name="about_page_heritage_description_two"
                    placeholder="Today, SAPT operates multiple locations throughout Buraidah..."
                  />
                  <Error errorName={errors.about_page_heritage_description_two} />
                </div>
              </div>

              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Heritage Image
                </label>
                <div className="sm:col-span-4">
                  <UploaderWithCropper
                    imageUrl={aboutMiddleContentImage}
                    setImageUrl={setAboutMiddleContentImage}
                    targetWidth={1420}
                    targetHeight={425}
                  />
                </div>
              </div>
            </div>

            {/* Team Section */}
            <div className="inline-flex md:text-base text-sm mb-3 md:mt-5 text-gray-500 dark:text-gray-400 ">
              <strong>Team Section</strong>
            </div>
            <hr className="md:mb-12 mb-3" />
            <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
              <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                Show Team Section
              </label>
              <div className="sm:col-span-4">
                <SwitchToggle
                  title=""
                  handleProcess={setOurFounderSection}
                  processOption={ourFounderSection}
                  name={ourFounderSection}
                />
              </div>
            </div>

            <div
              className="mb-height-0"
              style={{
                height: ourFounderSection ? "auto" : 0,
                transition: "all 0.5s",
                visibility: !ourFounderSection ? "hidden" : "visible",
                opacity: !ourFounderSection ? "0" : "1",
              }}
            >
              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Team Title
                </label>
                <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                    label="Team Title"
                    name="about_page_team_title"
                    type="text"
                    placeholder="Meet the SAPT Family"
                  />
                  <Error errorName={errors.about_page_team_title} />
                </div>
              </div>

              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Team Description
                </label>
                <div className="sm:col-span-4">
                  <TextAreaCom
                    register={register}
                    label="Team Description"
                    name="about_page_team_description"
                    placeholder="Our dedicated team members are the backbone of SAPT Markets..."
                  />
                  <Error errorName={errors.about_page_team_description} />
                </div>
              </div>

                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Leadership Title
                      </label>
                      <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                    label="Leadership Title"
                    name="about_page_leadership_title"
                    type="text"
                    placeholder="Leadership that Inspires"
                  />
                  <Error errorName={errors.about_page_leadership_title} />
                      </div>
                    </div>

              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Leadership Subtitle
                      </label>
                      <div className="sm:col-span-4">
                        <InputAreaTwo
                          register={register}
                    label="Leadership Subtitle"
                    name="about_page_leadership_subtitle"
                          type="text"
                    placeholder="Guided by Vision, Committed to Excellence"
                        />
                  <Error errorName={errors.about_page_leadership_subtitle} />
                      </div>
                    </div>

              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Values Title
                      </label>
                      <div className="sm:col-span-4">
                        <InputAreaTwo
                          register={register}
                    label="Values Title"
                    name="about_page_values_title"
                          type="text"
                    placeholder="Our Core Values"
                  />
                  <Error errorName={errors.about_page_values_title} />
                </div>
              </div>

              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
                <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Values Description
                </label>
                <div className="sm:col-span-4">
                  <TextAreaCom
                    register={register}
                    label="Values Description"
                    name="about_page_values_description"
                    placeholder="These fundamental principles guide every decision we make..."
                  />
                  <Error errorName={errors.about_page_values_description} />
                      </div>
                    </div>
            </div>

            {/* Core Values Section */}
            <div className="inline-flex md:text-base text-sm mb-3 md:mt-5 text-gray-500 dark:text-gray-400 ">
              <strong>Core Values Section</strong>
            </div>
            <hr className="md:mb-12 mb-3" />

                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                Show Values Section
                      </label>
                      <div className="sm:col-span-4">
                <SwitchToggle
                  title=""
                  handleProcess={setAboutCoreValues}
                  processOption={aboutCoreValues}
                  name={aboutCoreValues}
                        />
                      </div>
                    </div>

            <div
              className="mb-height-0"
              style={{
                height: aboutCoreValues ? "auto" : 0,
                transition: "all 0.5s",
                visibility: !aboutCoreValues ? "hidden" : "visible",
                opacity: !aboutCoreValues ? "0" : "1",
              }}
            >
              {/*  ====================================================== Core Values ====================================================== */}

              <TabsComponent>
                <Tabs>
                  <TabList>
                    <Tab>Value 1</Tab>
                    <Tab>Value 2</Tab>
                    <Tab>Value 3</Tab>
                    <Tab>Value 4</Tab>
                  </TabList>

                  <TabPanel className="mt-10">
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Value One Title
                      </label>
                      <div className="sm:col-span-4">
                        <InputAreaTwo
                          register={register}
                          label="Value One Title"
                          name="about_page_value_one_title"
                          type="text"
                          placeholder="Quality First"
                        />
                        <Error errorName={errors.about_page_value_one_title} />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Value One Description
                      </label>
                      <div className="sm:col-span-4">
                        <TextAreaCom
                          register={register}
                          label="Value One Description"
                          name="about_page_value_one_description"
                          placeholder="We never compromise on the quality of our products..."
                        />
                        <Error errorName={errors.about_page_value_one_description} />
                      </div>
                    </div>
                  </TabPanel>

                  <TabPanel>
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Value Two Title
                      </label>
                      <div className="sm:col-span-4">
                        <InputAreaTwo
                          register={register}
                          label="Value Two Title"
                          name="about_page_value_two_title"
                          type="text"
                          placeholder="Customer Care"
                        />
                        <Error errorName={errors.about_page_value_two_title} />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Value Two Description
                      </label>
                      <div className="sm:col-span-4">
                        <TextAreaCom
                          register={register}
                          label="Value Two Description"
                          name="about_page_value_two_description"
                          placeholder="Every customer is valued and deserves exceptional service..."
                        />
                        <Error errorName={errors.about_page_value_two_description} />
                      </div>
                    </div>
                  </TabPanel>

                  <TabPanel>
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Value Three Title
                      </label>
                      <div className="sm:col-span-4">
                        <InputAreaTwo
                          register={register}
                          label="Value Three Title"
                          name="about_page_value_three_title"
                          type="text"
                          placeholder="Community Focus"
                        />
                        <Error errorName={errors.about_page_value_three_title} />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Value Three Description
                      </label>
                      <div className="sm:col-span-4">
                        <TextAreaCom
                          register={register}
                          label="Value Three Description"
                          name="about_page_value_three_description"
                          placeholder="We're not just a store; we're part of the Qassim community..."
                        />
                        <Error errorName={errors.about_page_value_three_description} />
                      </div>
                    </div>
                  </TabPanel>

                  <TabPanel>
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Value Four Title
                      </label>
                      <div className="sm:col-span-4">
                        <InputAreaTwo
                          register={register}
                          label="Value Four Title"
                          name="about_page_value_four_title"
                          type="text"
                          placeholder="Innovation"
                        />
                        <Error errorName={errors.about_page_value_four_title} />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Value Four Description
                      </label>
                      <div className="sm:col-span-4">
                        <TextAreaCom
                          register={register}
                          label="Value Four Description"
                          name="about_page_value_four_description"
                          placeholder="We continuously evolve to meet changing customer needs..."
                        />
                        <Error errorName={errors.about_page_value_four_description} />
                      </div>
                    </div>
                  </TabPanel>
                </Tabs>
              </TabsComponent>
            </div>

            {/* Team Members Management */}
            <div className="inline-flex md:text-base text-sm mb-3 md:mt-5 text-gray-500 dark:text-gray-400 ">
              <strong>Team Members</strong>
            </div>
            <hr className="md:mb-12 mb-3" />

                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                Show Team Members
                      </label>
                      <div className="sm:col-span-4">
                <SwitchToggle
                  title=""
                  handleProcess={setOurFounderSection}
                  processOption={ourFounderSection}
                  name={ourFounderSection}
                />
              </div>
            </div>

            <div
              className="mb-height-0"
              style={{
                height: ourFounderSection ? "auto" : 0,
                transition: "all 0.5s",
                visibility: !ourFounderSection ? "hidden" : "visible",
                opacity: !ourFounderSection ? "0" : "1",
              }}
            >
              {/*  ====================================================== Team Members ====================================================== */}

              <TabsComponent>
                <Tabs>
                  <TabList>
                    <Tab>Member 1</Tab>
                    <Tab>Member 2</Tab>
                    <Tab>Member 3</Tab>
                    <Tab>Member 4</Tab>
                    <Tab>Member 5</Tab>
                    <Tab>Member 6</Tab>
                    <Tab>Member 7</Tab>
                    <Tab>Member 8</Tab>
                    <Tab>Member 9</Tab>
                    <Tab>Member 10</Tab>
                    <Tab>Member 11</Tab>
                    <Tab>Member 12</Tab>
                  </TabList>

                  <TabPanel className="mt-10">
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 1 Image
                      </label>
                      <div className="sm:col-span-4">
                        <UploaderWithCropper
                          imageUrl={ourFounderOneImage}
                          setImageUrl={setOurFounderOneImage}
                          targetWidth={600}
                          targetHeight={600}
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 1 Name
                      </label>
                      <div className="sm:col-span-4">
                        <InputAreaTwo
                          register={register}
                          label="Member 1 Name"
                          name="about_page_founder_one_name"
                          type="text"
                          placeholder="Team Member 1 Name"
                        />
                        <Error errorName={errors.about_page_founder_one_name} />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 1 Position
                      </label>
                      <div className="sm:col-span-4">
                        <InputAreaTwo
                          register={register}
                          label="Member 1 Position"
                          name="about_page_founder_one_position"
                          type="text"
                          placeholder="Team Member 1 Position"
                        />
                        <Error errorName={errors.about_page_founder_one_position} />
                      </div>
                    </div>
                  </TabPanel>

                  <TabPanel className="mt-10">
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 2 Image
                      </label>
                      <div className="sm:col-span-4">
                        <UploaderWithCropper
                          imageUrl={ourFounderTwoImage}
                          setImageUrl={setOurFounderTwoImage}
                          targetWidth={600}
                          targetHeight={600}
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 2 Name
                      </label>
                      <div className="sm:col-span-4">
                        <InputAreaTwo
                          register={register}
                          label="Member 2 Name"
                          name="about_page_founder_two_name"
                          type="text"
                          placeholder="Team Member 2 Name"
                        />
                        <Error errorName={errors.about_page_founder_two_name} />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 2 Position
                      </label>
                      <div className="sm:col-span-4">
                        <InputAreaTwo
                          register={register}
                          label="Member 2 Position"
                          name="about_page_founder_two_position"
                          type="text"
                          placeholder="Team Member 2 Position"
                        />
                        <Error errorName={errors.about_page_founder_two_position} />
                      </div>
                    </div>
                  </TabPanel>

                  <TabPanel className="mt-10">
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 3 Image
            </label>
            <div className="sm:col-span-4">
                        <UploaderWithCropper
                          imageUrl={ourFounderThreeImage}
                          setImageUrl={setOurFounderThreeImage}
                          targetWidth={600}
                          targetHeight={600}
                        />
            </div>
          </div>
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 3 Name
            </label>
            <div className="sm:col-span-4">
                  <InputAreaTwo
                register={register}
                          label="Member 3 Name"
                          name="about_page_founder_three_name"
                type="text"
                          placeholder="Team Member 3 Name"
              />
                        <Error errorName={errors.about_page_founder_three_name} />
            </div>
          </div>
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 3 Position
                  </label>
                      <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                          label="Member 3 Position"
                          name="about_page_founder_three_position"
                    type="text"
                          placeholder="Team Member 3 Position"
                  />
                        <Error errorName={errors.about_page_founder_three_position} />
                </div>
                </div>
                  </TabPanel>

                  <TabPanel className="mt-10">
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 4 Image
                  </label>
                      <div className="sm:col-span-4">
                        <UploaderWithCropper
                          imageUrl={ourFounderFourImage}
                          setImageUrl={setOurFounderFourImage}
                          targetWidth={600}
                          targetHeight={600}
                        />
                </div>
              </div>
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 4 Name
                  </label>
                      <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                          label="Member 4 Name"
                          name="about_page_founder_four_name"
                    type="text"
                          placeholder="Team Member 4 Name"
                  />
                        <Error errorName={errors.about_page_founder_four_name} />
                </div>
                </div>
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 4 Position
                  </label>
            <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                          label="Member 4 Position"
                          name="about_page_founder_four_position"
                    type="text"
                          placeholder="Team Member 4 Position"
                  />
                        <Error errorName={errors.about_page_founder_four_position} />
                </div>
          </div>
                  </TabPanel>

                  <TabPanel className="mt-10">
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 5 Image
                  </label>
            <div className="sm:col-span-4">
                        <UploaderWithCropper
                          imageUrl={ourFounderFiveImage}
                          setImageUrl={setOurFounderFiveImage}
                          targetWidth={600}
                          targetHeight={600}
                        />
                </div>
              </div>
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 5 Name
                  </label>
            <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                          label="Member 5 Name"
                          name="about_page_founder_five_name"
                    type="text"
                          placeholder="Team Member 5 Name"
                  />
                        <Error errorName={errors.about_page_founder_five_name} />
                </div>
                    </div>
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 5 Position
                  </label>
                      <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                          label="Member 5 Position"
                          name="about_page_founder_five_position"
                    type="text"
                          placeholder="Team Member 5 Position"
                  />
                        <Error errorName={errors.about_page_founder_five_position} />
                </div>
              </div>
                  </TabPanel>

                  <TabPanel className="mt-10">
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 6 Image
                  </label>
                      <div className="sm:col-span-4">
                        <UploaderWithCropper
                          imageUrl={ourFounderSixImage}
                          setImageUrl={setOurFounderSixImage}
                          targetWidth={600}
                          targetHeight={600}
                        />
          </div>
                    </div>
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 6 Name
            </label>
            <div className="sm:col-span-4">
              <InputAreaTwo
                register={register}
                          label="Member 6 Name"
                          name="about_page_founder_six_name"
                type="text"
                          placeholder="Team Member 6 Name"
              />
                        <Error errorName={errors.about_page_founder_six_name} />
            </div>
          </div>
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 6 Position
            </label>
            <div className="sm:col-span-4">
              <InputAreaTwo
                register={register}
                          label="Member 6 Position"
                          name="about_page_founder_six_position"
                type="text"
                          placeholder="Team Member 6 Position"
              />
                        <Error errorName={errors.about_page_founder_six_position} />
            </div>
          </div>
                  </TabPanel>

                  <TabPanel className="mt-10">
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 7 Image
            </label>
            <div className="sm:col-span-4">
                        <UploaderWithCropper
                          imageUrl={ourFounderSevenImage}
                          setImageUrl={setOurFounderSevenImage}
                          targetWidth={600}
                          targetHeight={600}
                        />
            </div>
          </div>
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 7 Name
                  </label>
            <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                          label="Member 7 Name"
                          name="about_page_founder_seven_name"
                    type="text"
                          placeholder="Team Member 7 Name"
                  />
                        <Error errorName={errors.about_page_founder_seven_name} />
                </div>
          </div>
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 7 Position
                  </label>
            <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                          label="Member 7 Position"
                          name="about_page_founder_seven_position"
                    type="text"
                          placeholder="Team Member 7 Position"
                  />
                        <Error errorName={errors.about_page_founder_seven_position} />
                </div>
              </div>
                  </TabPanel>

                  <TabPanel className="mt-10">
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 8 Image
                  </label>
                      <div className="sm:col-span-4">
                        <UploaderWithCropper
                          imageUrl={ourFounderEightImage}
                          setImageUrl={setOurFounderEightImage}
                          targetWidth={600}
                          targetHeight={600}
                        />
                </div>
                </div>
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 8 Name
                  </label>
                      <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                          label="Member 8 Name"
                          name="about_page_founder_eight_name"
                    type="text"
                          placeholder="Team Member 8 Name"
                  />
                        <Error errorName={errors.about_page_founder_eight_name} />
                </div>
              </div>
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 8 Position
            </label>
            <div className="sm:col-span-4">
              <InputAreaTwo
                register={register}
                          label="Member 8 Position"
                          name="about_page_founder_eight_position"
                type="text"
                          placeholder="Team Member 8 Position"
              />
                        <Error errorName={errors.about_page_founder_eight_position} />
            </div>
          </div>
                  </TabPanel>

                  <TabPanel className="mt-10">
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 9 Image
            </label>
            <div className="sm:col-span-4">
                        <UploaderWithCropper
                          imageUrl={ourFounderNineImage}
                          setImageUrl={setOurFounderNineImage}
                          targetWidth={600}
                          targetHeight={600}
                        />
            </div>
          </div>
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 9 Name
            </label>
            <div className="sm:col-span-4">
              <InputAreaTwo
                register={register}
                          label="Member 9 Name"
                          name="about_page_founder_nine_name"
                type="text"
                          placeholder="Team Member 9 Name"
              />
                        <Error errorName={errors.about_page_founder_nine_name} />
            </div>
          </div>
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 9 Position
            </label>
            <div className="sm:col-span-4">
                  <InputAreaTwo
                register={register}
                          label="Member 9 Position"
                          name="about_page_founder_nine_position"
                    type="text"
                          placeholder="Team Member 9 Position"
                  />
                        <Error errorName={errors.about_page_founder_nine_position} />
            </div>
          </div>
                  </TabPanel>

                  <TabPanel className="mt-10">
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 10 Image
                  </label>
                      <div className="sm:col-span-4">
                        <UploaderWithCropper
                          imageUrl={ourFounderTenImage}
                          setImageUrl={setOurFounderTenImage}
                          targetWidth={600}
                          targetHeight={600}
                        />
                </div>
                </div>
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 10 Name
                  </label>
                      <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                          label="Member 10 Name"
                          name="about_page_founder_ten_name"
                    type="text"
                          placeholder="Team Member 10 Name"
                  />
                        <Error errorName={errors.about_page_founder_ten_name} />
                </div>
                    </div>
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 10 Position
                  </label>
                      <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                          label="Member 10 Position"
                          name="about_page_founder_ten_position"
                    type="text"
                          placeholder="Team Member 10 Position"
                  />
                        <Error errorName={errors.about_page_founder_ten_position} />
                </div>
              </div>
                  </TabPanel>

                  <TabPanel className="mt-10">
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 11 Image
                  </label>
                      <div className="sm:col-span-4">
                        <UploaderWithCropper
                          imageUrl={ourFounderElevenImage}
                          setImageUrl={setOurFounderElevenImage}
                          targetWidth={600}
                          targetHeight={600}
                        />
                </div>
                </div>
                    <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
                      <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 11 Name
                  </label>
                      <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                          label="Member 11 Name"
                          name="about_page_founder_eleven_name"
                    type="text"
                          placeholder="Team Member 11 Name"
                  />
                        <Error errorName={errors.about_page_founder_eleven_name} />
                </div>
                </div>
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 11 Position
                  </label>
            <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                          label="Member 11 Position"
                          name="about_page_founder_eleven_position"
                    type="text"
                          placeholder="Team Member 11 Position"
                  />
                        <Error errorName={errors.about_page_founder_eleven_position} />
                </div>
              </div>
                  </TabPanel>

                  <TabPanel className="mt-10">
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 12 Image
                  </label>
            <div className="sm:col-span-4">
                        <UploaderWithCropper
                          imageUrl={ourFounderTwelveImage}
                          setImageUrl={setOurFounderTwelveImage}
                          targetWidth={600}
                          targetHeight={600}
                        />
                </div>
                </div>
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 12 Name
                  </label>
            <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                          label="Member 12 Name"
                          name="about_page_founder_twelve_name"
                    type="text"
                          placeholder="Team Member 12 Name"
                  />
                        <Error errorName={errors.about_page_founder_twelve_name} />
                </div>
          </div>
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                        Member 12 Position
                  </label>
            <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                          label="Member 12 Position"
                          name="about_page_founder_twelve_position"
                    type="text"
                          placeholder="Team Member 12 Position"
                  />
                        <Error errorName={errors.about_page_founder_twelve_position} />
                </div>
              </div>
                  </TabPanel>
                </Tabs>
              </TabsComponent>
            </div>

            {/* Branches Section */}
            <div className="inline-flex md:text-base text-sm mb-3 md:mt-5 text-gray-500 dark:text-gray-400 ">
              <strong>Branches Section</strong>
                </div>
            <hr className="md:mb-12 mb-3" />
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                Show Branches Section
                  </label>
            <div className="sm:col-span-4">
                <SwitchToggle
                  title=""
                  handleProcess={setAboutBranches}
                  processOption={aboutBranches}
                  name={aboutBranches}
                />
                </div>
          </div>

            <div
              className="mb-height-0"
              style={{
                height: aboutBranches ? "auto" : 0,
                transition: "all 0.5s",
                visibility: !aboutBranches ? "hidden" : "visible",
                opacity: !aboutBranches ? "0" : "1",
              }}
            >
              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Branches Title
                  </label>
            <div className="sm:col-span-4">
                  <InputAreaTwo
                    register={register}
                    label="Branches Title"
                    name="about_page_branches_title"
                    type="text"
                    placeholder="Our Locations"
                  />
                  <Error errorName={errors.about_page_branches_title} />
                </div>
          </div>

              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Branches Description
                  </label>
            <div className="sm:col-span-4">
              <TextAreaCom
                    register={register}
                    label="Branches Description"
                    name="about_page_branches_description"
                    placeholder="Visit any of our convenient locations throughout Buraidah..."
                  />
                  <Error errorName={errors.about_page_branches_description} />
            </div>
          </div>

              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
              Branches CTA Title
            </label>
            <div className="sm:col-span-4">
              <InputAreaTwo
                register={register}
                label="Branches CTA Title"
                name="about_page_branches_cta_title"
                type="text"
                placeholder="Can't Find Us?"
              />
              <Error errorName={errors.about_page_branches_cta_title} />
            </div>
          </div>

              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
              Branches CTA Description
            </label>
            <div className="sm:col-span-4">
              <TextAreaCom
                register={register}
                label="Branches CTA Description"
                name="about_page_branches_cta_description"
                    placeholder="We're expanding! New locations opening soon."
              />
              <Error errorName={errors.about_page_branches_cta_description} />
            </div>
          </div>

              <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                  Upcoming Branches Title
            </label>
            <div className="sm:col-span-4">
                  <InputAreaTwo
                register={register}
                    label="Upcoming Branches Title"
                    name="about_page_upcoming_branches_title"
                    type="text"
                    placeholder="Coming Soon to New Areas"
                  />
                  <Error errorName={errors.about_page_upcoming_branches_title} />
            </div>
          </div>

              {/* Upcoming Branches (Static Two) */}
              <div className="inline-flex md:text-base text-sm mb-3 mt-8 text-gray-500 dark:text-gray-400">
                <strong>Upcoming Branches</strong>
              </div>

              {[1, 2].map((num) => (
                <div key={num} className="border p-4 rounded-lg mb-6">
                  <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                      Branch {num} Name
            </label>
            <div className="sm:col-span-4">
              <InputAreaTwo
                register={register}
                        label={`Upcoming Branch ${num} Name`}
                        name={`about_page_upcoming_branch_${num === 1 ? 'one' : 'two'}_name`}
                type="text"
                        placeholder={`SAPT Upcoming Branch ${num}`}
              />
            </div>
          </div>

                  <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                      Address / Details
            </label>
            <div className="sm:col-span-4">
              <TextAreaCom
                register={register}
                        label={`Upcoming Branch ${num} Address`}
                        name={`about_page_upcoming_branch_${num === 1 ? 'one' : 'two'}_address`}
                        placeholder="District, City"
                      />
            </div>
          </div>

                  {/* Quarter */}
                  <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mt-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                      Opening Quarter (e.g., Q2 2025)
            </label>
            <div className="sm:col-span-4">
              <InputAreaTwo
                register={register}
                        label={`Upcoming Branch ${num} Quarter`}
                        name={`about_page_upcoming_branch_${num === 1 ? 'one' : 'two'}_quarter`}
                type="text"
                        placeholder="Q2 2025"
              />
            </div>
          </div>

                  {/* Planned Features */}
                  <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mt-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                      Planned Features (comma-separated)
            </label>
            <div className="sm:col-span-4">
              <TextAreaCom
                register={register}
                        label={`Upcoming Branch ${num} Features`}
                        name={`about_page_upcoming_branch_${num === 1 ? 'one' : 'two'}_features`}
                        placeholder="Largest Store, Food Court, Pharmacy"
                      />
            </div>
          </div>

                  {/* Emoji / Icon */}
                  <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mt-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                      Emoji Icon (single emoji)
            </label>
            <div className="sm:col-span-4">
                      <InputAreaTwo
                register={register}
                        label={`Upcoming Branch ${num} Emoji`}
                        name={`about_page_upcoming_branch_${num === 1 ? 'one' : 'two'}_emoji`}
                        type="text"
                        placeholder="🏬"
                      />
            </div>
          </div>
                </div>
              ))}

              {/* Branch Management */}
              <div className="inline-flex md:text-base text-sm mb-3 md:mt-5 text-gray-500 dark:text-gray-400 ">
                <strong>Branch Management</strong>
              </div>
              <hr className="md:mb-12 mb-3" />

              <TabsComponent>
                <Tabs>
                  <TabList>
                    <Tab>Branch 1</Tab>
                    <Tab>Branch 2</Tab>
                    <Tab>Branch 3</Tab>
                    <Tab>Branch 4</Tab>
                    <Tab>Branch 5</Tab>
                    <Tab>Branch 6</Tab>
                    <Tab>Branch 7</Tab>
                    <Tab>Branch 8</Tab>
                  </TabList>

                  {[...Array(8)].map((_, idx) => {
                    const branchNum = idx + 1;
                    const branchWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
                    const branchWord = branchWords[idx];
                    
                    return (
                      <TabPanel key={branchNum} className="mt-10">
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                            Branch {branchNum} Name
            </label>
            <div className="sm:col-span-4">
              <InputAreaTwo
                register={register}
                              label={`Branch ${branchNum} Name`}
                              name={`about_page_branch_${branchWord}_name`}
                type="text"
                              placeholder={`SAPT Branch ${branchNum}`}
              />
                            <Error errorName={errors[`about_page_branch_${branchWord}_name`]} />
            </div>
          </div>
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                            Branch {branchNum} Address
            </label>
            <div className="sm:col-span-4">
              <TextAreaCom
                register={register}
                              label={`Branch ${branchNum} Address`}
                              name={`about_page_branch_${branchWord}_address`}
                              placeholder="Address, City, District"
                            />
                            <Error errorName={errors[`about_page_branch_${branchWord}_address`]} />
            </div>
          </div>
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                            Branch {branchNum} Phone
            </label>
            <div className="sm:col-span-4">
              <InputAreaTwo
                register={register}
                              label={`Branch ${branchNum} Phone`}
                              name={`about_page_branch_${branchWord}_phone`}
                type="text"
                              placeholder="+966 16 123 4567"
              />
                            <Error errorName={errors[`about_page_branch_${branchWord}_phone`]} />
            </div>
          </div>
          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                            Branch {branchNum} Hours (Optional)
            </label>
            <div className="sm:col-span-4">
              <InputAreaTwo
                register={register}
                              label={`Branch ${branchNum} Hours`}
                              name={`about_page_branch_${branchWord}_hours`}
                type="text"
                              placeholder="Daily: 7:00 AM - 11:00 PM"
              />
                            <Error errorName={errors[`about_page_branch_${branchWord}_hours`]} />
            </div>
          </div>

          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
              Branch {branchNum} Subtitle / Type
            </label>
            <div className="sm:col-span-4">
              <InputAreaTwo
                register={register}
                label={`Branch ${branchNum} Subtitle`}
                name={`about_page_branch_${branchWord}_subtitle`}
                type="text"
                placeholder="Main Store, Express Store, Full Service..."
              />
              <Error errorName={errors[`about_page_branch_${branchWord}_subtitle`]} />
            </div>
          </div>

          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
              Branch {branchNum} Services (comma-separated)
            </label>
            <div className="sm:col-span-4">
              <TextAreaCom
                register={register}
                label={`Branch ${branchNum} Services`}
                name={`about_page_branch_${branchWord}_services`}
                placeholder="Fresh Produce, Bakery, Pharmacy, Electronics"
              />
              <Error errorName={errors[`about_page_branch_${branchWord}_services`]} />
            </div>
          </div>

          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
              Directions Link (Google Maps)
            </label>
            <div className="sm:col-span-4">
              <InputAreaTwo
                register={register}
                label={`Branch ${branchNum} Directions Link`}
                name={`about_page_branch_${branchWord}_directions`}
                type="text"
                placeholder="https://maps.google.com..."
              />
              <Error errorName={errors[`about_page_branch_${branchWord}_directions`]} />
        </div>
          </div>
                      </TabPanel>
                    );
                  })}
                </Tabs>
              </TabsComponent>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutUs;
