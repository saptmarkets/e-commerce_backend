import { Button } from "@windmill/react-ui";
import { useTranslation } from "react-i18next";
import { FiSettings } from "react-icons/fi";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

//internal import
import spinnerLoadingImage from "@/assets/img/spinner.gif";
import Error from "@/components/form/others/Error";
import InputAreaTwo from "@/components/form/input/InputAreaTwo";
import SwitchToggle from "@/components/form/switch/SwitchToggle";
import UploaderWithCropper from "@/components/image-uploader/UploaderWithCropper";

const PrivacyPolicy = ({
  isSave,
  errors,
  register,
  privacyPolicy,
  setPrivacyPolicy,
  setPrivacyPolicyHeaderBg,
  privacyPolicyHeaderBg,
  setTermsConditions,
  termsConditions,
  setTermsConditionsHeaderBg,
  termsConditionsHeaderBg,
  isSubmitting,
  textEdit,
  setTextEdit,
  termsConditionsTextEdit,
  setTermsConditionsTextEdit,
}) => {
  const { t } = useTranslation();

  const handlePrivacyPolicyEditorChange = (editorState) => {
    setTextEdit(editorState);
  };

  const handleTermsConditionsEditorChange = (editorState) => {
    setTermsConditionsTextEdit(editorState);
  };

  return (
    <>
      <div className="col-span-12 md:col-span-12 lg:col-span-12 pr-4">
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
            <Button type="submit" className="h-10 px-6 ">
              {" "}
              {isSave ? t("SaveBtn") : t("UpdateBtn")}
            </Button>
          )}
        </div>

        <div className="inline-flex md:text-lg text-base text-gray-800 font-semibold dark:text-gray-400 md:mb-3 mb-1">
          <FiSettings className="mt-1 mx-2" />
          {t("PrivacyPolicyTermsTitle")}
        </div>

        <hr className="md:mb-10 mb-4" />

        <div className="xl:px-10 flex-grow scrollbar-hide w-full max-h-full">
          <div className="inline-flex md:text-base text-sm md:mb-3 text-gray-500 dark:text-gray-400">
            <strong>{t("PrivacyPolicy")}</strong>
          </div>

          <hr className="md:mb-12 mb-3" />

          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
              {t("EnableThisBlock")}
            </label>
            <div className="sm:col-span-4">
              <SwitchToggle
                title=""
                handleProcess={setPrivacyPolicy}
                processOption={privacyPolicy}
                name={privacyPolicy}
              />
            </div>
          </div>

          <div
            id="description"
            className="mb-height-0"
            style={{
              height: privacyPolicy ? "auto" : 0,
              transition: "all 0.5s",
              visibility: !privacyPolicy ? "hidden" : "visible",
              opacity: !privacyPolicy ? "0" : "1",
            }}
          >
            <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3 relative">
              <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                {t("PageHeaderBg")}
              </label>
              <div className="sm:col-span-4">
                <UploaderWithCropper
                  imageUrl={privacyPolicyHeaderBg}
                  setImageUrl={setPrivacyPolicyHeaderBg}
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
                  name="privacy_page_title"
                  type="text"
                  placeholder={t("PageTitle")}
                />
                <Error errorName={errors.privacy_page_title} />
              </div>
            </div>

            <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
              <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                {t("PageText")}
              </label>

              <div className="sm:col-span-4">
                <div className="border border-gray-300 rounded-md">
                  <Editor
                    editorState={textEdit}
                    wrapperClassName="wrapper-class"
                    editorClassName="editor-class px-4 py-2 min-h-[300px]"
                    toolbarClassName="toolbar-class border-b border-gray-300"
                    onEditorStateChange={handlePrivacyPolicyEditorChange}
                    placeholder="Enter your privacy policy content here. Use the toolbar above to format your text."
                    toolbar={{
                      options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'link', 'history'],
                      inline: {
                        options: ['bold', 'italic', 'underline', 'strikethrough'],
                      },
                      blockType: {
                        options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
                      },
                      list: {
                        options: ['unordered', 'ordered'],
                      },
                      textAlign: {
                        options: ['left', 'center', 'right', 'justify'],
                      },
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Use the rich text editor above to format your privacy policy content with headings, lists, and styling.
                </div>
                <Error errorName={errors.privacy_policy_description} />
              </div>
            </div>

            {/* Effective & Last Updated */}
            <div className="grid md:grid-cols-2 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
              <InputAreaTwo
                register={register}
                label={t("EffectiveDate")}
                name="pp_effective_date"
                type="text"
                placeholder="January 1, 2024"
              />
              <InputAreaTwo
                register={register}
                label={t("LastUpdated")}
                name="pp_last_updated"
                type="text"
                placeholder="January 10, 2024"
              />
            </div>

            {/* Tagline */}
            <div className="md:mb-6 mb-3">
              <InputAreaTwo
                register={register}
                label={t("RibbonTagline")}
                name="pp_tagline"
                type="text"
                placeholder={t("RibbonTagline")}
              />
            </div>

            {/* Sections loop */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">{t("PolicySections")}</p>
              {[...Array(12)].map((_, idx) => (
                <div key={idx} className="grid md:grid-cols-2 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-3">
                  <InputAreaTwo
                    register={register}
                    label={`${t("SectionTitle")} ${idx + 1}`}
                    name={`pp_section_${idx + 1}_title`}
                    type="text"
                  />
                  <InputAreaTwo
                    register={register}
                    label={`${t("SectionBody")} ${idx + 1}`}
                    name={`pp_section_${idx + 1}_body`}
                    type="text"
                  />
                </div>
              ))}
            </div>

            {/* Rights loop */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">{t("DataRights")}</p>
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="grid md:grid-cols-3 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-3">
                  <InputAreaTwo
                    register={register}
                    label={`${t("RightName")} ${idx + 1}`}
                    name={`pp_right_${idx + 1}_name`}
                    type="text"
                  />
                  <InputAreaTwo
                    register={register}
                    label={`${t("RightDesc")} ${idx + 1}`}
                    name={`pp_right_${idx + 1}_desc`}
                    type="text"
                  />
                  <InputAreaTwo
                    register={register}
                    label={`${t("RightEmoji")} ${idx + 1}`}
                    name={`pp_right_${idx + 1}_emoji`}
                    type="text"
                    placeholder="🔒"
                  />
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="border-t border-gray-200 pt-4 mt-4 grid md:grid-cols-2 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
              <InputAreaTwo register={register} label={t("CTA_Title")} name="pp_cta_title" type="text" />
              <InputAreaTwo register={register} label={t("CTA_Desc")} name="pp_cta_desc" type="text" />
              <InputAreaTwo register={register} label={t("CTA_ButtonText")} name="pp_cta_btn_text" type="text" />
              <InputAreaTwo register={register} label={t("CTA_ButtonLink")} name="pp_cta_btn_link" type="text" />
            </div>
          </div>
        </div>

        <hr className="md:mb-12 mb-3" />

        <div className="xl:px-10 flex-grow scrollbar-hide w-full max-h-full">
          <div className="inline-flex md:text-base text-sm mb-3 text-gray-500 dark:text-gray-400">
            <strong>{t("TermsConditions")}</strong>
          </div>
          <hr className="md:mb-10 mb-3" />

          <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
              {t("EnableThisBlock")}
            </label>
            <div className="sm:col-span-4">
              <SwitchToggle
                title=""
                handleProcess={setTermsConditions}
                processOption={termsConditions}
                name={termsConditions}
              />
            </div>
          </div>

          <div
            style={{
              height: termsConditions ? "auto" : 0,
              transition: "all 0.5s",
              visibility: !termsConditions ? "hidden" : "visible",
              opacity: !termsConditions ? "0" : "1",
            }}
          >
            <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
              <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                {t("PageHeaderBg")}
              </label>
              <div className="sm:col-span-4">
                <UploaderWithCropper
                  imageUrl={termsConditionsHeaderBg}
                  setImageUrl={setTermsConditionsHeaderBg}
                  targetWidth={1920}
                  targetHeight={600}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
              <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                {t("PageTitle")}
              </label>
              <div className="sm:col-span-4">
                <InputAreaTwo
                  register={register}
                  label="Page Title"
                  name="termsConditions_page_title"
                  type="text"
                  placeholder={t("PageTitle")}
                />
                <Error errorName={errors.termsConditions_page_title} />
              </div>
            </div>

            <div className="grid md:grid-cols-5 sm:grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
              <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 md:mb-1">
                {t("PageText")}
              </label>
              <div className="sm:col-span-4">
                <div className="border border-gray-300 rounded-md">
                  <Editor
                    editorState={termsConditionsTextEdit}
                    wrapperClassName="wrapper-class"
                    editorClassName="editor-class px-4 py-2 min-h-[300px]"
                    toolbarClassName="toolbar-class border-b border-gray-300"
                    onEditorStateChange={handleTermsConditionsEditorChange}
                    placeholder="Enter your terms and conditions content here. Use the toolbar above to format your text."
                    toolbar={{
                      options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'link', 'history'],
                      inline: {
                        options: ['bold', 'italic', 'underline', 'strikethrough'],
                      },
                      blockType: {
                        options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
                      },
                      list: {
                        options: ['unordered', 'ordered'],
                      },
                      textAlign: {
                        options: ['left', 'center', 'right', 'justify'],
                      },
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {t("RichTextHint")}
                </div>
                <Error errorName={errors.terms_conditions_description} />
              </div>
            </div>

            {/* Effective & Last Updated for Terms */}
            <div className="grid md:grid-cols-2 gap-3 md:gap-5 xl:gap-6 lg:gap-6 md:mb-6 mb-3">
              <InputAreaTwo
                register={register}
                label={t("EffectiveDate")}
                name="tc_effective_date"
                type="text"
              />
              <InputAreaTwo
                register={register}
                label={t("LastUpdated")}
                name="tc_last_updated"
                type="text"
              />
            </div>

            {/* Sections loop (15) */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">{t("PolicySections")}</p>
              {[...Array(15)].map((_, idx) => (
                <div key={idx} className="grid md:grid-cols-2 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-3">
                  <InputAreaTwo
                    register={register}
                    label={`${t("SectionTitle")} ${idx + 1}`}
                    name={`tc_section_${idx + 1}_title`}
                    type="text"
                  />
                  <InputAreaTwo
                    register={register}
                    label={`${t("SectionBody")} ${idx + 1}`}
                    name={`tc_section_${idx + 1}_body`}
                    type="text"
                  />
                </div>
              ))}
            </div>

            {/* CTA for Terms */}
            <div className="border-t border-gray-200 pt-4 mt-4 grid md:grid-cols-2 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
              <InputAreaTwo register={register} label={t("CTA_Title")} name="tc_cta_title" type="text" />
              <InputAreaTwo register={register} label={t("CTA_Desc")} name="tc_cta_desc" type="text" />
              <InputAreaTwo register={register} label={t("CTA_ButtonText")} name="tc_cta_btn_text" type="text" />
              <InputAreaTwo register={register} label={t("CTA_ButtonLink")} name="tc_cta_btn_link" type="text" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
