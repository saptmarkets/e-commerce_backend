import { EditorState, convertToRaw } from "draft-js";
import { stateFromHTML } from "draft-js-import-html";
import draftToHtml from "draftjs-to-html";
import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

//internal import
import useUtilsFunction from "./useUtilsFunction";
import useDisableForDemo from "./useDisableForDemo";
import { notifyError, notifySuccess } from "@/utils/toast";
import { SidebarContext } from "@/context/SidebarContext";
import SettingServices from "@/services/SettingServices";
import CouponServices from "@/services/CouponServices";

const createEditorState = (text) => {
  const contentState = stateFromHTML(text);
  return EditorState.createWithContent(contentState);
};

const useStoreHomeSubmit = () => {
  const { setIsUpdate, lang } = useContext(SidebarContext);
  const { showingTranslateValue } = useUtilsFunction();

  const [resData, setResData] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [couponList, setCouponList] = useState([]);
  const [couponList1, setCouponList1] = useState([]);
  const [language, setLanguage] = useState("en");

  const [isSave, setIsSave] = useState(true);
  const [printSlip, setPrintSlip] = useState(true);
  const [emailSlip, setEmailSlip] = useState(true);
  const [isCoupon, setIsCoupon] = useState(true);
  const [allowDiscount, setAllowDiscount] = useState(true);
  const [paymentOption, setPaymentOption] = useState(true);
  const [orderProcess, setOrderProcess] = useState(true);
  const [allowOutOfStock, setAllowOutOfStock] = useState(true);
  const [isSliderFullWidth, setIsSliderFullWidth] = useState(false);
  const [isPlaceholder, setIsPlaceholder] = useState(true);
  const [promotionBanner, setPromotionBanner] = useState(true);
  const [featuredCategories, setFeaturedCategories] = useState(true);
  const [popularProducts, setPopularProducts] = useState(true);
  const [quickDelivery, setQuickDelivery] = useState(true);
  const [latestDiscounted, setLatestDiscounted] = useState(true);
  const [dailyNeeds, setDailyNeeds] = useState(true);
  const [featurePromo, setFeaturePromo] = useState(true);
  const [footerBlock1, setFooterBlock1] = useState(true);
  const [footerBlock2, setFooterBlock2] = useState(true);
  const [footerBlock3, setFooterBlock3] = useState(true);
  const [footerBlock4, setFooterBlock4] = useState(true);
  const [footerSocialLinks, setFooterSocialLinks] = useState(true);
  const [footerPaymentMethod, setFooterPaymentMethod] = useState(true);
  const [footerBottomContact, setFooterBottomContact] = useState(true);
  const [allowPromotionBanner, setAllowPromotionBanner] = useState(false);
  const [discount_coupon_status, setDiscount_coupon_status] = useState(true);
  const [singleProductPageRightBox, setSingleProductPageRightBox] =
    useState(true);
  const [leftRightArrow, setLeftRightArrow] = useState(false);
  const [bottomDots, setBottomDots] = useState(true);
  const [bothSliderOption, setBothSliderOption] = useState(true);

  const [faqMenuLink, setFaqMenuLink] = useState(true);
  const [emailUsBox, setEmailUsBox] = useState(true);
  const [callUsBox, setCallUsBox] = useState(true);
  const [addressBox, setAddressBox] = useState(true);
  const [faqStatus, setFaqStatus] = useState(true);
  const [offersMenuLink, setOffersMenuLink] = useState(true);
  const [privacyPolicy, setPrivacyPolicy] = useState(true);
  const [termsConditions, setTermsConditions] = useState(true);
  const [faqLeftColStatus, setFaqLeftColStatus] = useState(true);
  const [faqRightColStatus, setFaqRightColStatus] = useState(true);
  const [offersPageHeader, setOffersPageHeader] = useState(true);
  const [aboutPageHeader, setAboutPageHeader] = useState(true);
  const [categoriesMenuLink, setCategoriesMenuLink] = useState(true);
  const [aboutUsMenuLink, setAboutUsMenuLink] = useState(true);
  const [contactUsMenuLink, setContactUsMenuLink] = useState(true);
  const [contactPageHeader, setContactPageHeader] = useState(true);
  const [contactFormStatus, setContactFormStatus] = useState(true);
  const [ourFounderSection, setOurFounderSection] = useState(true);
  const [aboutTopContentLeft, setAboutTopContentLeft] = useState(true);
  const [aboutTopContentRight, setAboutTopContentRight] = useState(true);
  const [privacyPolicyMenuLink, setPrivacyPolicyMenuLink] = useState(true);
  const [termsConditionsMenuLink, setTermsConditionsMenuLink] = useState(true);
  const [contactMidLeftColStatus, setContactMidLeftColStatus] = useState(true);
  const [contactMidLeftColImage, setContactMidLeftColImage] = useState("");
  const [aboutMiddleContentSection, setAboutMiddleContentSection] =
    useState(true);

  const [metaImg, setMetaImg] = useState("");
  const [favicon, setFavicon] = useState("");
  const [footerLogo, setFooterLogo] = useState("");
  const [headerLogo, setHeaderLogo] = useState("");
  const [sliderImage, setSliderImage] = useState("");
  const [paymentImage, setPaymentImage] = useState("");
  const [faqHeaderBg, setFaqHeaderBg] = useState("");
  const [aboutHeaderBg, setAboutHeaderBg] = useState("");
  const [offersHeaderBg, setOffersHeaderBg] = useState("");
  const [sliderImageTwo, setSliderImageTwo] = useState("");
  const [getButton1image, setGetButton1image] = useState("");
  const [getButton2image, setGetButton2image] = useState("");
  const [faqLeftColImage, setFaqLeftColImage] = useState("");
  const [contactHeaderBg, setContactHeaderBg] = useState("");
  const [sliderImageThree, setSliderImageThree] = useState("");
  const [sliderImageFour, setSliderImageFour] = useState("");
  const [sliderImageFive, setSliderImageFive] = useState("");
  const [placeholderImage, setPlaceHolderImage] = useState("");
  const [quickSectionImage, setQuickSectionImage] = useState("");
  const [ourFounderOneImage, setOurFounderOneImage] = useState("");
  const [ourFounderTwoImage, setOurFounderTwoImage] = useState("");
  const [ourFounderThreeImage, setOurFounderThreeImage] = useState("");
  const [ourFounderFourImage, setOurFounderFourImage] = useState("");
  const [ourFounderFiveImage, setOurFounderFiveImage] = useState("");
  const [ourFounderSixImage, setOurFounderSixImage] = useState("");

  // Additional founder images for extended team
  const [ourFounderSevenImage, setOurFounderSevenImage] = useState("");
  const [ourFounderEightImage, setOurFounderEightImage] = useState("");
  const [ourFounderNineImage, setOurFounderNineImage] = useState("");
  const [ourFounderTenImage, setOurFounderTenImage] = useState("");
  const [ourFounderElevenImage, setOurFounderElevenImage] = useState("");
  const [ourFounderTwelveImage, setOurFounderTwelveImage] = useState("");

  // About Us section toggles
  const [aboutCoreValues, setAboutCoreValues] = useState(true);
  const [aboutBranches, setAboutBranches] = useState(true);
  const [aboutMiddleContentImage, setAboutMiddleContentImage] = useState("");
  const [privacyPolicyHeaderBg, setPrivacyPolicyHeaderBg] = useState("");
  const [getYourDailyNeedImageLeft, setGetYourDailyNeedImageLeft] =
    useState("");
  const [getYourDailyNeedImageRight, setGetYourDailyNeedImageRight] =
    useState("");
  const [textEdit, setTextEdit] = useState(createEditorState(""));
  const [termsConditionsTextEdit, setTermsConditionsTextEdit] = useState(
    createEditorState("")
  );
  const [aboutTopContentRightImage, setAboutTopContentRightImage] =
    useState("");
  const [termsConditionsHeaderBg, setTermsConditionsHeaderBg] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleDisableForDemo } = useDisableForDemo();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      about_page_upcoming_branch_one_name: "",
      about_page_upcoming_branch_one_address: "",
      about_page_upcoming_branch_two_name: "",
      about_page_upcoming_branch_two_address: "",
      about_page_upcoming_branch_one_quarter: "",
      about_page_upcoming_branch_one_features: "",
      about_page_upcoming_branch_one_emoji: "",
      about_page_upcoming_branch_two_quarter: "",
      about_page_upcoming_branch_two_features: "",
      about_page_upcoming_branch_two_emoji: "",
      about_page_trusted_badge_one_pill: "",
      about_page_trusted_badge_one_text: "",
      about_page_trusted_badge_two_pill: "",
      about_page_trusted_badge_two_text: "",
    },
  });

  const handleRemoveEmptyKey = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].trim() === "") {
        delete obj[key];
      } else if (obj[key] === null || obj[key] === undefined) {
        delete obj[key];
      }
    }
    // console.log("obj", obj);
    return obj;
  };

  const onSubmit = async (data) => {
    console.log('=== ONSUBMIT FUNCTION CALLED ===');
    console.log('Form data:', data);
    
    // Temporarily disable demo mode check for debugging
    // if (handleDisableForDemo()) {
    //   console.log('onSubmit: Demo mode is enabled, preventing submission');
    //   return; // Exit the function if the feature is disabled
    // }
    
    try {
      console.log('Setting isSubmitting to true...');
      setIsSubmitting(true);

      const storeCustomizationSettingData = {
        name: "storeCustomizationSetting",
        setting: {
          navbar: {
            categories_menu_status: categoriesMenuLink,
            about_menu_status: aboutUsMenuLink,
            contact_menu_status: contactUsMenuLink,
            offers_menu_status: offersMenuLink,
            term_and_condition_status: termsConditionsMenuLink,
            privacy_policy_status: privacyPolicyMenuLink,
            faq_status: faqMenuLink,
            help_text: handleRemoveEmptyKey({
              ...resData?.navbar?.help_text,
              [language]: data.help_text || "",
            }),
            categories: handleRemoveEmptyKey({
              ...resData?.navbar?.categories,
              [language]: data.categories || "",
            }),
            about_us: handleRemoveEmptyKey({
              ...resData?.navbar?.about_us,
              [language]: data.about_us || "",
            }),
            contact_us: handleRemoveEmptyKey({
              ...resData?.navbar?.contact_us,
              [language]: data.contact_us || "",
            }),
            offers: handleRemoveEmptyKey({
              ...resData?.navbar?.offers,
              [language]: data.offers || "",
            }),
            faq: handleRemoveEmptyKey({
              ...resData?.navbar?.faq,
              [language]: data.faq || "",
            }),
            privacy_policy: handleRemoveEmptyKey({
              ...resData?.navbar?.privacy_policy,
              [language]: data.privacy_policy || "",
            }),
            term_and_condition: handleRemoveEmptyKey({
              ...resData?.navbar?.term_and_condition,
              [language]: data.term_and_condition || "",
            }),

            pages: handleRemoveEmptyKey({
              ...resData?.navbar?.pages,
              [language]: data.pages || "",
            }),
            my_account: handleRemoveEmptyKey({
              ...resData?.navbar?.my_account,
              [language]: data.my_account || "",
            }),
            login: handleRemoveEmptyKey({
              ...resData?.navbar?.login,
              [language]: data.login || "",
            }),
            logout: handleRemoveEmptyKey({
              ...resData?.navbar?.logout,
              [language]: data.logout || "",
            }),
            checkout: handleRemoveEmptyKey({
              ...resData?.navbar?.checkout,
              [language]: data.checkout || "",
            }),
            phone: data.phone_number,
            logo: headerLogo,
          },
          home: {
            coupon_status: isCoupon,
            featured_status: featuredCategories,
            discount_status: latestDiscounted,
            daily_needs_status: dailyNeeds,

            slider_width_status: isSliderFullWidth,
            promotion_banner_status: allowPromotionBanner,
            delivery_status: quickDelivery,
            popular_products_status: popularProducts,
            discount_product_status: latestDiscounted,
            discount_coupon_code: couponList?.map((coupon) => coupon?.value),
            place_holder_img: placeholderImage,
            feature_promo_status: featurePromo,

            quick_delivery_link: data.quick_delivery_link,
            quick_delivery_img: quickSectionImage,

            discount_title: handleRemoveEmptyKey({
              ...resData?.home?.discount_title,
              [language]: data.discount_title || "",
            }),

            promotion_title: handleRemoveEmptyKey({
              ...resData?.home?.promotion_title,
              [language]: data.promotion_title || "",
            }),
            promotion_description: handleRemoveEmptyKey({
              ...resData?.home?.promotion_description,
              [language]: data.promotion_description || "",
            }),
            promotion_button_name: handleRemoveEmptyKey({
              ...resData?.home?.promotion_button_name,
              [language]: data.promotion_button_name || "",
            }),
            promotion_button_link: data.promotion_button_link,

            feature_title: handleRemoveEmptyKey({
              ...resData?.home?.feature_title,
              [language]: data.feature_title || "",
            }),
            feature_description: handleRemoveEmptyKey({
              ...resData?.home?.feature_description,
              [language]: data.feature_description || "",
            }),
            feature_product_limit: data.feature_product_limit,

            popular_title: handleRemoveEmptyKey({
              ...resData?.home?.popular_title,
              [language]: data.popular_title || "",
            }),
            popular_description: handleRemoveEmptyKey({
              ...resData?.home?.popular_description,
              [language]: data.popular_description || "",
            }),
            popular_product_limit: data.popular_product_limit,

            quick_delivery_subtitle: handleRemoveEmptyKey({
              ...resData?.home?.quick_delivery_subtitle,
              [language]: data.quick_delivery_subtitle || "",
            }),
            quick_delivery_title: handleRemoveEmptyKey({
              ...resData?.home?.quick_delivery_title,
              [language]: data.quick_delivery_title || "",
            }),
            quick_delivery_description: handleRemoveEmptyKey({
              ...resData?.home?.quick_delivery_description,
              [language]: data.quick_delivery_description || "",
            }),
            quick_delivery_button: handleRemoveEmptyKey({
              ...resData?.home?.quick_delivery_button,
              [language]: data.quick_delivery_button || "",
            }),

            latest_discount_title: handleRemoveEmptyKey({
              ...resData?.home?.latest_discount_title,
              [language]: data.latest_discount_title || "",
            }),
            latest_discount_description: handleRemoveEmptyKey({
              ...resData?.home?.latest_discount_description,
              [language]: data.latest_discount_description || "",
            }),
            latest_discount_product_limit: data.latest_discount_product_limit,

            daily_need_title: handleRemoveEmptyKey({
              ...resData?.home?.daily_need_title,
              [language]: data.daily_need_title || "",
            }),
            daily_need_description: handleRemoveEmptyKey({
              ...resData?.home?.daily_need_description,
              [language]: data.daily_need_description || "",
            }),
            daily_need_app_link: data.daily_need_app_link,
            daily_need_google_link: data.daily_need_google_link,
            daily_need_img_left: getYourDailyNeedImageLeft,
            daily_need_img_right: getYourDailyNeedImageRight,
            button1_img: getButton1image,
            button2_img: getButton2image,
          },
          about_us: {
            header_status: aboutPageHeader,
            content_left_status: aboutTopContentLeft,
            content_right_status: aboutTopContentRight,
            top_section_image: aboutTopContentRightImage,
            content_middle_status: aboutMiddleContentSection,
            founder_status: ourFounderSection,
            branches_status: aboutBranches,
            header_bg: aboutHeaderBg,
            content_middle_Img: aboutMiddleContentImage,
            founder_one_img: ourFounderOneImage,
            founder_two_img: ourFounderTwoImage,
            founder_three_img: ourFounderThreeImage,
            founder_four_img: ourFounderFourImage,
            founder_five_img: ourFounderFiveImage,
            founder_six_img: ourFounderSixImage,
            founder_seven_img: ourFounderSevenImage,
            founder_eight_img: ourFounderEightImage,
            founder_nine_img: ourFounderNineImage,
            founder_ten_img: ourFounderTenImage,
            founder_eleven_img: ourFounderElevenImage,
            founder_twelve_img: ourFounderTwelveImage,
            title: handleRemoveEmptyKey({
              ...resData?.about_us?.title,
              [language]: data.about_page_title || "",
            }),

            hero_description: handleRemoveEmptyKey({
              ...resData?.about_us?.hero_description,
              [language]: data.about_page_hero_description || "",
            }),

            top_section_title: handleRemoveEmptyKey({
              ...resData?.about_us?.top_section_title,
              [language]: data.about_page_top_section_title || "",
            }),

            top_section_description: handleRemoveEmptyKey({
              ...resData?.about_us?.top_section_description,
              [language]: data.about_page_top_section_description || "",
            }),

            top_section_image: aboutTopContentRightImage,

            top_title: handleRemoveEmptyKey({
              ...resData?.about_us?.top_title,
              [language]: data.about_page_Top_title || "",
            }),

            top_description: handleRemoveEmptyKey({
              ...resData?.about_us?.top_description,
              [language]: data.about_us_top_description || "",
            }),

            card_one_title: handleRemoveEmptyKey({
              ...resData?.about_us?.card_one_title,
              [language]: data.about_page_card_one_title || "",
            }),

            card_one_sub: handleRemoveEmptyKey({
              ...resData?.about_us?.card_one_sub,
              [language]: data.about_page_card_one_subtitle || "",
            }),

            card_one_description: handleRemoveEmptyKey({
              ...resData?.about_us?.card_one_description,
              [language]: data.about_page_card_one_description || "",
            }),
            card_two_title: handleRemoveEmptyKey({
              ...resData?.about_us?.card_two_title,
              [language]: data.about_page_card_two_title || "",
            }),
            card_two_sub: handleRemoveEmptyKey({
              ...resData?.about_us?.card_two_sub,
              [language]: data.about_page_card_two_subtitle || "",
            }),
            card_two_description: handleRemoveEmptyKey({
              ...resData?.about_us?.card_two_description,
              [language]: data.about_page_card_two_description || "",
            }),
            middle_description_one: handleRemoveEmptyKey({
              ...resData?.about_us?.middle_description_one,
              [language]: data.about_us_middle_description_one || "",
            }),
            middle_description_two: handleRemoveEmptyKey({
              ...resData?.about_us?.middle_description_two,
              [language]: data.about_us_middle_description_two || "",
            }),
            founder_title: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_title,
              [language]: data.about_page_ourfounder_title || "",
            }),
            founder_description: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_description,
              [language]: data.about_us_ourfounder_description || "",
            }),
            founder_one_name: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_one_name,
              [language]: data.about_page_ourfounder_one_title || "",
            }),
            founder_one_sub: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_one_sub,
              [language]: data.about_page_ourfounder_one_sub_title || "",
            }),
            founder_two_name: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_two_name,
              [language]: data.about_page_ourfounder_two_title || "",
            }),
            founder_two_sub: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_two_sub,
              [language]: data.about_page_ourfounder_two_sub_title || "",
            }),
            founder_three_name: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_three_name,
              [language]: data.about_page_ourfounder_three_title || "",
            }),
            founder_three_sub: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_three_sub,
              [language]: data.about_page_ourfounder_three_sub_title || "",
            }),
            founder_four_name: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_four_name,
              [language]: data.about_page_ourfounder_four_title || "",
            }),
            founder_four_sub: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_four_sub,
              [language]: data.about_page_ourfounder_four_sub_title || "",
            }),
            founder_five_name: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_five_name,
              [language]: data.about_page_ourfounder_five_title || "",
            }),
            founder_five_sub: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_five_sub,
              [language]: data.about_page_ourfounder_five_sub_title || "",
            }),
            founder_six_name: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_six_name,
              [language]: data.about_page_ourfounder_six_title || "",
            }),
            founder_six_sub: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_six_sub,
              [language]: data.about_page_ourfounder_six_sub_title || "",
            }),
            // Core Values Section
            values_title: handleRemoveEmptyKey({
              ...resData?.about_us?.values_title,
              [language]: data.about_page_values_title || "",
            }),
            values_description: handleRemoveEmptyKey({
              ...resData?.about_us?.values_description,
              [language]: data.about_page_values_description || "",
            }),
            value_one_title: handleRemoveEmptyKey({
              ...resData?.about_us?.value_one_title,
              [language]: data.about_page_value_one_title || "",
            }),
            value_one_description: handleRemoveEmptyKey({
              ...resData?.about_us?.value_one_description,
              [language]: data.about_page_value_one_description || "",
            }),
            value_two_title: handleRemoveEmptyKey({
              ...resData?.about_us?.value_two_title,
              [language]: data.about_page_value_two_title || "",
            }),
            value_two_description: handleRemoveEmptyKey({
              ...resData?.about_us?.value_two_description,
              [language]: data.about_page_value_two_description || "",
            }),
            value_three_title: handleRemoveEmptyKey({
              ...resData?.about_us?.value_three_title,
              [language]: data.about_page_value_three_title || "",
            }),
            value_three_description: handleRemoveEmptyKey({
              ...resData?.about_us?.value_three_description,
              [language]: data.about_page_value_three_description || "",
            }),
            value_four_title: handleRemoveEmptyKey({
              ...resData?.about_us?.value_four_title,
              [language]: data.about_page_value_four_title || "",
            }),
            value_four_description: handleRemoveEmptyKey({
              ...resData?.about_us?.value_four_description,
              [language]: data.about_page_value_four_description || "",
            }),
            // Growing Stronger Communities Section
            community_title: handleRemoveEmptyKey({
              ...resData?.about_us?.community_title,
              [language]: data.about_page_community_title || "",
            }),
            community_description_one: handleRemoveEmptyKey({
              ...resData?.about_us?.community_description_one,
              [language]: data.about_page_community_description_one || "",
            }),
            community_description_two: handleRemoveEmptyKey({
              ...resData?.about_us?.community_description_two,
              [language]: data.about_page_community_description_two || "",
            }),
            community_stat_one_number: handleRemoveEmptyKey({
              ...resData?.about_us?.community_stat_one_number,
              [language]: data.about_page_community_stat_one_number || "",
            }),
            community_stat_one_label: handleRemoveEmptyKey({
              ...resData?.about_us?.community_stat_one_label,
              [language]: data.about_page_community_stat_one_label || "",
            }),
            community_stat_two_number: handleRemoveEmptyKey({
              ...resData?.about_us?.community_stat_two_number,
              [language]: data.about_page_community_stat_two_number || "",
            }),
            community_stat_two_label: handleRemoveEmptyKey({
              ...resData?.about_us?.community_stat_two_label,
              [language]: data.about_page_community_stat_two_label || "",
            }),
            community_cta_title: handleRemoveEmptyKey({
              ...resData?.about_us?.community_cta_title,
              [language]: data.about_page_community_cta_title || "",
            }),
            community_cta_description: handleRemoveEmptyKey({
              ...resData?.about_us?.community_cta_description,
              [language]: data.about_page_community_cta_description || "",
            }),
            // Heritage Section
            heritage_title: handleRemoveEmptyKey({
              ...resData?.about_us?.heritage_title,
              [language]: data.about_page_heritage_title || "",
            }),

            heritage_description_one: handleRemoveEmptyKey({
              ...resData?.about_us?.heritage_description_one,
              [language]: data.about_page_heritage_description_one || "",
            }),

            heritage_description_two: handleRemoveEmptyKey({
              ...resData?.about_us?.heritage_description_two,
              [language]: data.about_page_heritage_description_two || "",
            }),

            heritage_image: aboutMiddleContentImage,

            // Team Section
            team_title: handleRemoveEmptyKey({
              ...resData?.about_us?.team_title,
              [language]: data.about_page_team_title || "",
            }),

            team_description: handleRemoveEmptyKey({
              ...resData?.about_us?.team_description,
              [language]: data.about_page_team_description || "",
            }),

            leadership_title: handleRemoveEmptyKey({
              ...resData?.about_us?.leadership_title,
              [language]: data.about_page_leadership_title || "",
            }),

            leadership_subtitle: handleRemoveEmptyKey({
              ...resData?.about_us?.leadership_subtitle,
              [language]: data.about_page_leadership_subtitle || "",
            }),

            // Core Values
            value_one_title: handleRemoveEmptyKey({
              ...resData?.about_us?.value_one_title,
              [language]: data.about_page_value_one_title || "",
            }),

            value_one_description: handleRemoveEmptyKey({
              ...resData?.about_us?.value_one_description,
              [language]: data.about_page_value_one_description || "",
            }),

            value_two_title: handleRemoveEmptyKey({
              ...resData?.about_us?.value_two_title,
              [language]: data.about_page_value_two_title || "",
            }),

            value_two_description: handleRemoveEmptyKey({
              ...resData?.about_us?.value_two_description,
              [language]: data.about_page_value_two_description || "",
            }),

            value_three_title: handleRemoveEmptyKey({
              ...resData?.about_us?.value_three_title,
              [language]: data.about_page_value_three_title || "",
            }),

            value_three_description: handleRemoveEmptyKey({
              ...resData?.about_us?.value_three_description,
              [language]: data.about_page_value_three_description || "",
            }),

            value_four_title: handleRemoveEmptyKey({
              ...resData?.about_us?.value_four_title,
              [language]: data.about_page_value_four_title || "",
            }),

            value_four_description: handleRemoveEmptyKey({
              ...resData?.about_us?.value_four_description,
              [language]: data.about_page_value_four_description || "",
            }),

            // Team Members (12 members)
            founder_one_name: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_one_name,
              [language]: data.about_page_founder_one_name || "",
            }),

            founder_one_position: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_one_position,
              [language]: data.about_page_founder_one_position || "",
            }),

            founder_two_name: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_two_name,
              [language]: data.about_page_founder_two_name || "",
            }),

            founder_two_position: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_two_position,
              [language]: data.about_page_founder_two_position || "",
            }),

            founder_three_name: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_three_name,
              [language]: data.about_page_founder_three_name || "",
            }),

            founder_three_position: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_three_position,
              [language]: data.about_page_founder_three_position || "",
            }),

            founder_four_name: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_four_name,
              [language]: data.about_page_founder_four_name || "",
            }),

            founder_four_position: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_four_position,
              [language]: data.about_page_founder_four_position || "",
            }),

            founder_five_name: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_five_name,
              [language]: data.about_page_founder_five_name || "",
            }),

            founder_five_position: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_five_position,
              [language]: data.about_page_founder_five_position || "",
            }),

            founder_six_name: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_six_name,
              [language]: data.about_page_founder_six_name || "",
            }),

            founder_six_position: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_six_position,
              [language]: data.about_page_founder_six_position || "",
            }),

            founder_seven_name: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_seven_name,
              [language]: data.about_page_founder_seven_name || "",
            }),
            founder_seven_sub: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_seven_sub,
              [language]: data.about_page_founder_seven_position || "",
            }),
            founder_seven_position: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_seven_position,
              [language]: data.about_page_founder_seven_position || "",
            }),

            founder_eight_name: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_eight_name,
              [language]: data.about_page_founder_eight_name || "",
            }),
            founder_eight_sub: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_eight_sub,
              [language]: data.about_page_founder_eight_position || "",
            }),
            founder_eight_position: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_eight_position,
              [language]: data.about_page_founder_eight_position || "",
            }),

            founder_nine_name: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_nine_name,
              [language]: data.about_page_founder_nine_name || "",
            }),
            founder_nine_sub: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_nine_sub,
              [language]: data.about_page_founder_nine_position || "",
            }),
            founder_nine_position: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_nine_position,
              [language]: data.about_page_founder_nine_position || "",
            }),

            founder_ten_name: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_ten_name,
              [language]: data.about_page_founder_ten_name || "",
            }),
            founder_ten_sub: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_ten_sub,
              [language]: data.about_page_founder_ten_position || "",
            }),
            founder_ten_position: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_ten_position,
              [language]: data.about_page_founder_ten_position || "",
            }),

            founder_eleven_name: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_eleven_name,
              [language]: data.about_page_founder_eleven_name || "",
            }),
            founder_eleven_sub: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_eleven_sub,
              [language]: data.about_page_founder_eleven_position || "",
            }),
            founder_eleven_position: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_eleven_position,
              [language]: data.about_page_founder_eleven_position || "",
            }),

            founder_twelve_name: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_twelve_name,
              [language]: data.about_page_founder_twelve_name || "",
            }),
            founder_twelve_sub: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_twelve_sub,
              [language]: data.about_page_founder_twelve_position || "",
            }),
            founder_twelve_position: handleRemoveEmptyKey({
              ...resData?.about_us?.founder_twelve_position,
              [language]: data.about_page_founder_twelve_position || "",
            }),

            // Branches
            branches_title: handleRemoveEmptyKey({
              ...resData?.about_us?.branches_title,
              [language]: data.about_page_branches_title || "",
            }),

            branches_description: handleRemoveEmptyKey({
              ...resData?.about_us?.branches_description,
              [language]: data.about_page_branches_description || "",
            }),
            branches_cta_title: handleRemoveEmptyKey({
              ...resData?.about_us?.branches_cta_title,
              [language]: data.about_page_branches_cta_title || "",
            }),
            branches_cta_description: handleRemoveEmptyKey({
              ...resData?.about_us?.branches_cta_description,
              [language]: data.about_page_branches_cta_description || "",
            }),

            // Individual Branch Data
            branch_one_name: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_one_name,
              [language]: data.about_page_branch_one_name || "",
            }),
            branch_one_address: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_one_address,
              [language]: data.about_page_branch_one_address || "",
            }),
            branch_one_phone: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_one_phone,
              [language]: data.about_page_branch_one_phone || "",
            }),
            branch_one_hours: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_one_hours,
              [language]: data.about_page_branch_one_hours || "",
            }),
            branch_one_subtitle: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_one_subtitle,
              [language]: data.about_page_branch_one_subtitle || "",
            }),
            branch_one_services: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_one_services,
              [language]: data.about_page_branch_one_services || "",
            }),
            branch_one_directions: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_one_directions,
              [language]: data.about_page_branch_one_directions || "",
            }),

            branch_two_name: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_two_name,
              [language]: data.about_page_branch_two_name || "",
            }),
            branch_two_address: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_two_address,
              [language]: data.about_page_branch_two_address || "",
            }),
            branch_two_phone: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_two_phone,
              [language]: data.about_page_branch_two_phone || "",
            }),
            branch_two_hours: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_two_hours,
              [language]: data.about_page_branch_two_hours || "",
            }),
            branch_two_subtitle: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_two_subtitle,
              [language]: data.about_page_branch_two_subtitle || "",
            }),
            branch_two_services: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_two_services,
              [language]: data.about_page_branch_two_services || "",
            }),
            branch_two_directions: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_two_directions,
              [language]: data.about_page_branch_two_directions || "",
            }),

            branch_three_name: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_three_name,
              [language]: data.about_page_branch_three_name || "",
            }),
            branch_three_address: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_three_address,
              [language]: data.about_page_branch_three_address || "",
            }),
            branch_three_phone: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_three_phone,
              [language]: data.about_page_branch_three_phone || "",
            }),
            branch_three_hours: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_three_hours,
              [language]: data.about_page_branch_three_hours || "",
            }),
            branch_three_subtitle: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_three_subtitle,
              [language]: data.about_page_branch_three_subtitle || "",
            }),
            branch_three_services: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_three_services,
              [language]: data.about_page_branch_three_services || "",
            }),
            branch_three_directions: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_three_directions,
              [language]: data.about_page_branch_three_directions || "",
            }),

            branch_four_name: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_four_name,
              [language]: data.about_page_branch_four_name || "",
            }),
            branch_four_address: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_four_address,
              [language]: data.about_page_branch_four_address || "",
            }),
            branch_four_phone: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_four_phone,
              [language]: data.about_page_branch_four_phone || "",
            }),
            branch_four_hours: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_four_hours,
              [language]: data.about_page_branch_four_hours || "",
            }),
            branch_four_subtitle: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_four_subtitle,
              [language]: data.about_page_branch_four_subtitle || "",
            }),
            branch_four_services: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_four_services,
              [language]: data.about_page_branch_four_services || "",
            }),
            branch_four_directions: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_four_directions,
              [language]: data.about_page_branch_four_directions || "",
            }),

            branch_five_name: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_five_name,
              [language]: data.about_page_branch_five_name || "",
            }),
            branch_five_address: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_five_address,
              [language]: data.about_page_branch_five_address || "",
            }),
            branch_five_phone: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_five_phone,
              [language]: data.about_page_branch_five_phone || "",
            }),
            branch_five_hours: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_five_hours,
              [language]: data.about_page_branch_five_hours || "",
            }),
            branch_five_subtitle: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_five_subtitle,
              [language]: data.about_page_branch_five_subtitle || "",
            }),
            branch_five_services: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_five_services,
              [language]: data.about_page_branch_five_services || "",
            }),
            branch_five_directions: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_five_directions,
              [language]: data.about_page_branch_five_directions || "",
            }),

            branch_six_name: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_six_name,
              [language]: data.about_page_branch_six_name || "",
            }),
            branch_six_address: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_six_address,
              [language]: data.about_page_branch_six_address || "",
            }),
            branch_six_phone: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_six_phone,
              [language]: data.about_page_branch_six_phone || "",
            }),
            branch_six_hours: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_six_hours,
              [language]: data.about_page_branch_six_hours || "",
            }),
            branch_six_subtitle: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_six_subtitle,
              [language]: data.about_page_branch_six_subtitle || "",
            }),
            branch_six_services: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_six_services,
              [language]: data.about_page_branch_six_services || "",
            }),
            branch_six_directions: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_six_directions,
              [language]: data.about_page_branch_six_directions || "",
            }),

            branch_seven_name: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_seven_name,
              [language]: data.about_page_branch_seven_name || "",
            }),
            branch_seven_address: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_seven_address,
              [language]: data.about_page_branch_seven_address || "",
            }),
            branch_seven_phone: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_seven_phone,
              [language]: data.about_page_branch_seven_phone || "",
            }),
            branch_seven_hours: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_seven_hours,
              [language]: data.about_page_branch_seven_hours || "",
            }),
            branch_seven_subtitle: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_seven_subtitle,
              [language]: data.about_page_branch_seven_subtitle || "",
            }),
            branch_seven_services: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_seven_services,
              [language]: data.about_page_branch_seven_services || "",
            }),
            branch_seven_directions: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_seven_directions,
              [language]: data.about_page_branch_seven_directions || "",
            }),

            branch_eight_name: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_eight_name,
              [language]: data.about_page_branch_eight_name || "",
            }),
            branch_eight_address: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_eight_address,
              [language]: data.about_page_branch_eight_address || "",
            }),
            branch_eight_phone: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_eight_phone,
              [language]: data.about_page_branch_eight_phone || "",
            }),
            branch_eight_hours: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_eight_hours,
              [language]: data.about_page_branch_eight_hours || "",
            }),
            branch_eight_subtitle: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_eight_subtitle,
              [language]: data.about_page_branch_eight_subtitle || "",
            }),
            branch_eight_services: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_eight_services,
              [language]: data.about_page_branch_eight_services || "",
            }),
            branch_eight_directions: handleRemoveEmptyKey({
              ...resData?.about_us?.branch_eight_directions,
              [language]: data.about_page_branch_eight_directions || "",
            }),

            upcoming_branches_title: handleRemoveEmptyKey({
              ...resData?.about_us?.upcoming_branches_title,
              [language]: data.about_page_upcoming_branches_title || "",
            }),

            upcoming_branch_one_name: handleRemoveEmptyKey({
              ...resData?.about_us?.upcoming_branch_one_name,
              [language]: data.about_page_upcoming_branch_one_name || "",
            }),
            upcoming_branch_one_address: handleRemoveEmptyKey({
              ...resData?.about_us?.upcoming_branch_one_address,
              [language]: data.about_page_upcoming_branch_one_address || "",
            }),

            upcoming_branch_two_name: handleRemoveEmptyKey({
              ...resData?.about_us?.upcoming_branch_two_name,
              [language]: data.about_page_upcoming_branch_two_name || "",
            }),
            upcoming_branch_two_address: handleRemoveEmptyKey({
              ...resData?.about_us?.upcoming_branch_two_address,
              [language]: data.about_page_upcoming_branch_two_address || "",
            }),

            upcoming_branch_one_quarter: handleRemoveEmptyKey({
              ...resData?.about_us?.upcoming_branch_one_quarter,
              [language]: data.about_page_upcoming_branch_one_quarter || "",
            }),
            upcoming_branch_one_features: handleRemoveEmptyKey({
              ...resData?.about_us?.upcoming_branch_one_features,
              [language]: data.about_page_upcoming_branch_one_features || "",
            }),
            upcoming_branch_one_emoji: handleRemoveEmptyKey({
              ...resData?.about_us?.upcoming_branch_one_emoji,
              [language]: data.about_page_upcoming_branch_one_emoji || "",
            }),

            upcoming_branch_two_quarter: handleRemoveEmptyKey({
              ...resData?.about_us?.upcoming_branch_two_quarter,
              [language]: data.about_page_upcoming_branch_two_quarter || "",
            }),
            upcoming_branch_two_features: handleRemoveEmptyKey({
              ...resData?.about_us?.upcoming_branch_two_features,
              [language]: data.about_page_upcoming_branch_two_features || "",
            }),
            upcoming_branch_two_emoji: handleRemoveEmptyKey({
              ...resData?.about_us?.upcoming_branch_two_emoji,
              [language]: data.about_page_upcoming_branch_two_emoji || "",
            }),
            trusted_badge_one_pill: handleRemoveEmptyKey({
              ...resData?.about_us?.trusted_badge_one_pill,
              [language]: data.about_page_trusted_badge_one_pill || "",
            }),
            trusted_badge_one_text: handleRemoveEmptyKey({
              ...resData?.about_us?.trusted_badge_one_text,
              [language]: data.about_page_trusted_badge_one_text || "",
            }),
            trusted_badge_two_pill: handleRemoveEmptyKey({
              ...resData?.about_us?.trusted_badge_two_pill,
              [language]: data.about_page_trusted_badge_two_pill || "",
            }),
            trusted_badge_two_text: handleRemoveEmptyKey({
              ...resData?.about_us?.trusted_badge_two_text,
              [language]: data.about_page_trusted_badge_two_text || "",
            }),
          },
          contact_us: {
            header_status: contactPageHeader,
            email_box_status: emailUsBox,
            call_box_status: callUsBox,
            address_box_status: addressBox,
            left_col_status: contactMidLeftColStatus,
            form_status: contactFormStatus,
            header_bg: contactHeaderBg,
            left_col_img: contactMidLeftColImage,
            title: handleRemoveEmptyKey({
              ...resData?.contact_us?.title,
              [language]: data.contact_page_title || "",
            }),

            email_box_title: handleRemoveEmptyKey({
              ...resData?.contact_us?.email_box_title,
              [language]: data.email_box_title || "",
            }),
            email_box_email: handleRemoveEmptyKey({
              ...resData?.contact_us?.email_box_email,
              [language]: data.email_box_email || "",
            }),
            email_box_text: handleRemoveEmptyKey({
              ...resData?.contact_us?.email_box_text,
              [language]: data.email_box_text || "",
            }),

            call_box_title: handleRemoveEmptyKey({
              ...resData?.contact_us?.call_box_title,
              [language]: data.callUs_box_title || "",
            }),
            call_box_phone: handleRemoveEmptyKey({
              ...resData?.contact_us?.call_box_phone,
              [language]: data.callUs_box_phone || "",
            }),
            call_box_text: handleRemoveEmptyKey({
              ...resData?.contact_us?.call_box_text,
              [language]: data.callUs_box_text || "",
            }),

            address_box_title: handleRemoveEmptyKey({
              ...resData?.contact_us?.address_box_title,
              [language]: data.address_box_title || "",
            }),
            address_box_address_one: handleRemoveEmptyKey({
              ...resData?.contact_us?.address_box_address_one,
              [language]: data.address_box_address_one || "",
            }),
            address_box_address_two: handleRemoveEmptyKey({
              ...resData?.contact_us?.address_box_address_two,
              [language]: data.address_box_address_two || "",
            }),
            address_box_address_three: handleRemoveEmptyKey({
              ...resData?.contact_us?.address_box_address_three,
              [language]: data.address_box_address_three || "",
            }),
            form_title: handleRemoveEmptyKey({
              ...resData?.contact_us?.form_title,
              [language]: data.contact_form_title || "",
            }),
            form_description: handleRemoveEmptyKey({
              ...resData?.contact_us?.form_description,
              [language]: data.contact_form_description || "",
            }),
          },
          offers: {
            header_status: offersPageHeader,
            header_bg: offersHeaderBg,
            title: handleRemoveEmptyKey({
              ...resData?.offers?.title,
              [language]: data.offers_page_title || "",
            }),
            coupon_code: couponList1?.map((coupon) => coupon?.value),
          },
          privacy_policy: {
            status: privacyPolicy,
            header_bg: privacyPolicyHeaderBg,

            effective_date: data.pp_effective_date,
            last_updated: data.pp_last_updated,
            tagline: handleRemoveEmptyKey({
              ...resData?.privacy_policy?.tagline,
              [language]: data.pp_tagline || "",
            }),

            title: handleRemoveEmptyKey({
              ...resData?.privacy_policy?.title,
              [language]: data.privacy_page_title || "",
            }),

            description: handleRemoveEmptyKey({
              ...resData?.privacy_policy?.description,
              [language]: textEdit
                ? draftToHtml(convertToRaw(textEdit.getCurrentContent()))
                : "",
            }),

            // CTA fields
            cta_title: handleRemoveEmptyKey({
              ...resData?.privacy_policy?.cta_title,
              [language]: data.pp_cta_title || "",
            }),
            cta_desc: handleRemoveEmptyKey({
              ...resData?.privacy_policy?.cta_desc,
              [language]: data.pp_cta_desc || "",
            }),
            cta_btn_text: handleRemoveEmptyKey({
              ...resData?.privacy_policy?.cta_btn_text,
              [language]: data.pp_cta_btn_text || "",
            }),
            cta_btn_link: data.pp_cta_btn_link,

            // dynamic sections 1-12
            ...( (() => {
              const words = [
                "one","two","three","four","five","six","seven","eight",
                "nine","ten","eleven","twelve"
              ];
              return words.reduce((acc,w,idx)=>{
                acc[`section_${w}_title`] = handleRemoveEmptyKey({
                  ...resData?.privacy_policy?.[`section_${w}_title`],
                  [language]: data[`pp_section_${idx+1}_title`] || "",
                });
                acc[`section_${w}_body`] = handleRemoveEmptyKey({
                  ...resData?.privacy_policy?.[`section_${w}_body`],
                  [language]: data[`pp_section_${idx+1}_body`] || "",
                });
                return acc;
              }, {});
            })() ),

            // rights boxes 1-6
            ...( (() => {
              return Array.from({length:6}).reduce((acc,_,idx)=>{
                const n = idx + 1;
                acc[`right_${n}_name`] = handleRemoveEmptyKey({
                  ...resData?.privacy_policy?.[`right_${n}_name`],
                  [language]: data[`pp_right_${n}_name`] || "",
                });
                acc[`right_${n}_desc`] = handleRemoveEmptyKey({
                  ...resData?.privacy_policy?.[`right_${n}_desc`],
                  [language]: data[`pp_right_${n}_desc`] || "",
                });
                acc[`right_${n}_emoji`] = data[`pp_right_${n}_emoji`] || "";
                return acc;
              }, {});
            })() ),
          },
          term_and_condition: {
            status: termsConditions,
            header_bg: termsConditionsHeaderBg,

            effective_date: data.tc_effective_date,
            last_updated: data.tc_last_updated,

            title: handleRemoveEmptyKey({
              ...resData?.term_and_condition?.title,
              [language]: data.termsConditions_page_title || "",
            }),

            description: {
              ...resData?.term_and_condition?.description,
              [language]: termsConditionsTextEdit
                ? draftToHtml(
                    convertToRaw(termsConditionsTextEdit.getCurrentContent())
                  )
                : "",
            },

            // CTA fields
            cta_title: handleRemoveEmptyKey({
              ...resData?.term_and_condition?.cta_title,
              [language]: data.tc_cta_title || "",
            }),
            cta_desc: handleRemoveEmptyKey({
              ...resData?.term_and_condition?.cta_desc,
              [language]: data.tc_cta_desc || "",
            }),
            cta_btn_text: handleRemoveEmptyKey({
              ...resData?.term_and_condition?.cta_btn_text,
              [language]: data.tc_cta_btn_text || "",
            }),
            cta_btn_link: data.tc_cta_btn_link,

            // dynamic sections
            ...( (() => {
              const words = [
                "one","two","three","four","five","six","seven","eight",
                "nine","ten","eleven","twelve","thirteen","fourteen","fifteen"
              ];
              return words.reduce((acc,w,idx)=>{
                acc[`section_${w}_title`] = handleRemoveEmptyKey({
                  ...resData?.term_and_condition?.[`section_${w}_title`],
                  [language]: data[`tc_section_${idx+1}_title`] || "",
                });
                acc[`section_${w}_body`] = handleRemoveEmptyKey({
                  ...resData?.term_and_condition?.[`section_${w}_body`],
                  [language]: data[`tc_section_${idx+1}_body`] || "",
                });
                return acc;
              }, {});
            })() ),
          },
          faq: {
            page_status: faqStatus,
            header_bg: faqHeaderBg,
            leftcol_status: faqLeftColStatus,
            rightcol_status: faqRightColStatus,
            left_img: faqLeftColImage,

            title: handleRemoveEmptyKey({
              ...resData?.faq?.title,
              [language]: data.faq_page_title || "",
            }),
            faq_one: handleRemoveEmptyKey({
              ...resData?.faq?.faq_one,
              [language]: data.faq_title_one || "",
            }),
            description_one: handleRemoveEmptyKey({
              ...resData?.faq?.description_one,
              [language]: data.faq_description_one || "",
            }),
            faq_two: handleRemoveEmptyKey({
              ...resData?.faq?.faq_two,
              [language]: data.faq_title_two || "",
            }),
            description_two: handleRemoveEmptyKey({
              ...resData?.faq?.description_two,
              [language]: data.faq_description_two || "",
            }),
            faq_three: handleRemoveEmptyKey({
              ...resData?.faq?.faq_three,
              [language]: data.faq_title_three || "",
            }),
            description_three: handleRemoveEmptyKey({
              ...resData?.faq?.description_three,
              [language]: data.faq_description_three || "",
            }),
            faq_four: handleRemoveEmptyKey({
              ...resData?.faq?.faq_four,
              [language]: data.faq_title_four || "",
            }),
            description_four: handleRemoveEmptyKey({
              ...resData?.faq?.description_four,
              [language]: data.faq_description_four || "",
            }),
            faq_five: handleRemoveEmptyKey({
              ...resData?.faq?.faq_five,
              [language]: data.faq_title_five || "",
            }),
            description_five: handleRemoveEmptyKey({
              ...resData?.faq?.description_five,
              [language]: data.faq_description_five || "",
            }),
            faq_six: handleRemoveEmptyKey({
              ...resData?.faq?.faq_six,
              [language]: data.faq_title_six || "",
            }),
            description_six: handleRemoveEmptyKey({
              ...resData?.faq?.description_six,
              [language]: data.faq_description_six || "",
            }),
            faq_seven: handleRemoveEmptyKey({
              ...resData?.faq?.faq_seven,
              [language]: data.faq_title_seven || "",
            }),
            description_seven: handleRemoveEmptyKey({
              ...resData?.faq?.description_seven,
              [language]: data.faq_description_seven || "",
            }),
            faq_eight: handleRemoveEmptyKey({
              ...resData?.faq?.faq_eight,
              [language]: data.faq_title_eight || "",
            }),
            description_eight: handleRemoveEmptyKey({
              ...resData?.faq?.description_eight,
              [language]: data.faq_description_eight || "",
            }),
          },

          slider: {
            left_right_arrow: leftRightArrow,
            bottom_dots: bottomDots,
            both_slider: bothSliderOption,

            first_img: sliderImage,
            first_title: handleRemoveEmptyKey({
              ...resData?.slider?.first_title,
              [language]: data.slider_title || "",
            }),
            first_description: handleRemoveEmptyKey({
              ...resData?.slider?.first_description,
              [language]: data.slider_description || "",
            }),
            first_button: handleRemoveEmptyKey({
              ...resData?.slider?.first_button,
              [language]: data.slider_button_name || "",
            }),
            first_link: data.slider_button_link,

            second_img: sliderImageTwo,
            second_title: handleRemoveEmptyKey({
              ...resData?.slider?.second_title,
              [language]: data.slider_title_two || "",
            }),
            second_description: handleRemoveEmptyKey({
              ...resData?.slider?.second_description,
              [language]: data.slider_description_two || "",
            }),
            second_button: handleRemoveEmptyKey({
              ...resData?.slider?.second_button,
              [language]: data.slider_button_name_two || "",
            }),
            second_link: data.slider_button_link_two,

            third_img: sliderImageThree,
            third_title: handleRemoveEmptyKey({
              ...resData?.slider?.third_title,
              [language]: data.slider_title_three || "",
            }),
            third_description: handleRemoveEmptyKey({
              ...resData?.slider?.third_description,
              [language]: data.slider_description_three || "",
            }),
            third_button: handleRemoveEmptyKey({
              ...resData?.slider?.third_button,
              [language]: data.slider_button_name_three || "",
            }),
            third_link: data.slider_button_link_three,

            four_img: sliderImageFour,
            four_title: handleRemoveEmptyKey({
              ...resData?.slider?.four_title,
              [language]: data.slider_title_four || "",
            }),
            four_description: handleRemoveEmptyKey({
              ...resData?.slider?.four_description,
              [language]: data.slider_description_four || "",
            }),
            four_button: handleRemoveEmptyKey({
              ...resData?.slider?.four_button,
              [language]: data.slider_button_name_four || "",
            }),
            four_link: data.slider_button_link_four,

            five_img: sliderImageFive,
            five_title: handleRemoveEmptyKey({
              ...resData?.slider?.five_title,
              [language]: data.slider_title_five || "",
            }),
            five_description: handleRemoveEmptyKey({
              ...resData?.slider?.five_description,
              [language]: data.slider_description_five || "",
            }),
            five_button: handleRemoveEmptyKey({
              ...resData?.slider?.five_button,
              [language]: data.slider_button_name_five || "",
            }),
            five_link: data.slider_button_link_five,
          },

          checkout: {
            personal_details: handleRemoveEmptyKey({
              ...resData?.checkout?.personal_details,
              [language]: data.personal_details || "",
            }),
            first_name: handleRemoveEmptyKey({
              ...resData?.checkout?.first_name,
              [language]: data.first_name || "",
            }),
            last_name: handleRemoveEmptyKey({
              ...resData?.checkout?.last_name,
              [language]: data.last_name || "",
            }),
            email_address: handleRemoveEmptyKey({
              ...resData?.checkout?.email_address,
              [language]: data.email_address || "",
            }),
            checkout_phone: handleRemoveEmptyKey({
              ...resData?.checkout?.checkout_phone,
              [language]: data.checkout_phone || "",
            }),

            shipping_details: handleRemoveEmptyKey({
              ...resData?.checkout?.shipping_details,
              [language]: data.shipping_details || "",
            }),
            street_address: handleRemoveEmptyKey({
              ...resData?.checkout?.street_address,
              [language]: data.street_address || "",
            }),
            city: handleRemoveEmptyKey({
              ...resData?.checkout?.city,
              [language]: data.city || "",
            }),
            country: handleRemoveEmptyKey({
              ...resData?.checkout?.country,
              [language]: data.country || "",
            }),
            zip_code: handleRemoveEmptyKey({
              ...resData?.checkout?.zip_code,
              [language]: data.zip_code || "",
            }),
            shipping_cost: handleRemoveEmptyKey({
              ...resData?.checkout?.shipping_cost,
              [language]: data.shipping_cost || "",
            }),
            shipping_name_one: handleRemoveEmptyKey({
              ...resData?.checkout?.shipping_name_one,
              [language]: data.shipping_name_one || "",
            }),
            shipping_one_desc: handleRemoveEmptyKey({
              ...resData?.checkout?.shipping_one_desc,
              [language]: data.shipping_one_desc || "",
            }),
            shipping_one_cost: data?.shipping_one_cost,
            shipping_name_two: handleRemoveEmptyKey({
              ...resData?.checkout?.shipping_name_two,
              [language]: data.shipping_name_two || "",
            }),
            shipping_two_desc: handleRemoveEmptyKey({
              ...resData?.checkout?.shipping_two_desc,
              [language]: data.shipping_two_desc || "",
            }),
            shipping_two_cost: data?.shipping_two_cost,
            payment_method: handleRemoveEmptyKey({
              ...resData?.checkout?.payment_method,
              [language]: data.payment_method || "",
            }),
            continue_button: handleRemoveEmptyKey({
              ...resData?.checkout?.continue_button,
              [language]: data.continue_button || "",
            }),
            confirm_button: handleRemoveEmptyKey({
              ...resData?.checkout?.confirm_button,
              [language]: data.confirm_button || "",
            }),
            order_summary: handleRemoveEmptyKey({
              ...resData?.checkout?.order_summary,
              [language]: data.order_summary || "",
            }),
            apply_button: handleRemoveEmptyKey({
              ...resData?.checkout?.apply_button,
              [language]: data.apply_button || "",
            }),
            sub_total: handleRemoveEmptyKey({
              ...resData?.checkout?.sub_total,
              [language]: data.sub_total || "",
            }),
            discount: handleRemoveEmptyKey({
              ...resData?.checkout?.discount,
              [language]: data.discount || "",
            }),
            total_cost: handleRemoveEmptyKey({
              ...resData?.checkout?.total_cost,
              [language]: data.total_cost || "",
            }),
          },

          // Distance-Based Shipping Configuration
          distanceBasedShipping: {
            store_latitude: data?.store_latitude || null,
            store_longitude: data?.store_longitude || null,
            base_shipping_cost: data?.base_shipping_cost || 0,
            cost_per_km: data?.cost_per_km || 0,
            max_delivery_distance: data?.max_delivery_distance || null,
            free_delivery_radius: data?.free_delivery_radius || null,
            min_order_free_delivery: data?.min_order_free_delivery || null,
            enable_free_shipping: data?.enable_free_shipping || false,
          },

          dashboard: {
            invoice_message_first: handleRemoveEmptyKey({
              ...resData?.dashboard?.invoice_message_first,
              [language]: data.invoice_message_first || "",
            }),
            invoice_message_last: handleRemoveEmptyKey({
              ...resData?.dashboard?.invoice_message_last,
              [language]: data.invoice_message_last || "",
            }),
            print_button: handleRemoveEmptyKey({
              ...resData?.dashboard?.print_button,
              [language]: data.print_button || "",
            }),
            download_button: handleRemoveEmptyKey({
              ...resData?.dashboard?.download_button,
              [language]: data.download_button || "",
            }),
            dashboard_title: handleRemoveEmptyKey({
              ...resData?.dashboard?.dashboard_title,
              [language]: data.dashboard_title || "",
            }),
            total_order: handleRemoveEmptyKey({
              ...resData?.dashboard?.total_order,
              [language]: data.total_order || "",
            }),
            pending_order: handleRemoveEmptyKey({
              ...resData?.dashboard?.pending_order,
              [language]: data.pending_order || "",
            }),

            processing_order: handleRemoveEmptyKey({
              ...resData?.dashboard?.processing_order,
              [language]: data.processing_order || "",
            }),
            complete_order: handleRemoveEmptyKey({
              ...resData?.dashboard?.complete_order,
              [language]: data.complete_order || "",
            }),
            recent_order: handleRemoveEmptyKey({
              ...resData?.dashboard?.recent_order,
              [language]: data.recent_order || "",
            }),
            my_order: handleRemoveEmptyKey({
              ...resData?.dashboard?.my_order,
              [language]: data.my_order || "",
            }),
            update_profile: handleRemoveEmptyKey({
              ...resData?.dashboard?.update_profile,
              [language]: data.update_profile || "",
            }),
            full_name: handleRemoveEmptyKey({
              ...resData?.dashboard?.full_name,
              [language]: data.full_name || "",
            }),
            address: handleRemoveEmptyKey({
              ...resData?.dashboard?.address,
              [language]: data.address || "",
            }),
            user_phone: handleRemoveEmptyKey({
              ...resData?.dashboard?.user_phone,
              [language]: data.user_phone || "",
            }),
            user_email: handleRemoveEmptyKey({
              ...resData?.dashboard?.user_email,
              [language]: data.user_email || "",
            }),
            update_button: handleRemoveEmptyKey({
              ...resData?.dashboard?.update_button,
              [language]: data.update_button || "",
            }),
            current_password: handleRemoveEmptyKey({
              ...resData?.dashboard?.current_password,
              [language]: data.current_password || "",
            }),
            new_password: handleRemoveEmptyKey({
              ...resData?.dashboard?.new_password,
              [language]: data.new_password || "",
            }),
            change_password: handleRemoveEmptyKey({
              ...resData?.dashboard?.change_password,
              [language]: data.change_password || "",
            }),
          },
          footer: {
            promo_status: true,
            block1_status: footerBlock1,
            block2_status: footerBlock2,
            block3_status: footerBlock3,
            block4_status: footerBlock4,
            payment_method_status: footerPaymentMethod,
            bottom_contact_status: footerBottomContact,
            social_links_status: footerSocialLinks,

            shipping_card: handleRemoveEmptyKey({
              ...resData?.footer?.shipping_card,
              [language]: data.promo_free_shipping || "",
            }),
            support_card: handleRemoveEmptyKey({
              ...resData?.footer?.support_card,
              [language]: data.promo_support || "",
            }),
            payment_card: handleRemoveEmptyKey({
              ...resData?.footer?.payment_card,
              [language]: data.promo_payment || "",
            }),
            offer_card: handleRemoveEmptyKey({
              ...resData?.footer?.offer_card,
              [language]: data.promo_offer || "",
            }),

            block1_title: handleRemoveEmptyKey({
              ...resData?.footer?.block1_title,
              [language]: data.footer_block_one_title || "",
            }),

            block1_sub_title1: handleRemoveEmptyKey({
              ...resData?.footer?.block1_sub_title1,
              [language]: data.footer_block_one_link_one_title || "",
            }),
            block1_sub_link1: data.footer_block_one_link_one,

            block1_sub_title2: handleRemoveEmptyKey({
              ...resData?.footer?.block1_sub_title2,
              [language]: data.footer_block_one_link_two_title || "",
            }),
            block1_sub_link2: data.footer_block_one_link_two,

            block1_sub_title3: handleRemoveEmptyKey({
              ...resData?.footer?.block1_sub_title3,
              [language]: data.footer_block_one_link_three_title || "",
            }),
            block1_sub_link3: data.footer_block_one_link_three,

            block1_sub_title4: handleRemoveEmptyKey({
              ...resData?.footer?.block1_sub_title4,
              [language]: data.footer_block_one_link_four_title || "",
            }),
            block1_sub_link4: data.footer_block_one_link_four,

            block2_title: handleRemoveEmptyKey({
              ...resData?.footer?.block2_title,
              [language]: data.footer_block_two_title || "",
            }),

            block2_sub_title1: handleRemoveEmptyKey({
              ...resData?.footer?.block2_sub_title1,
              [language]: data.footer_block_two_link_one_title || "",
            }),
            block2_sub_link1: data.footer_block_two_link_one,

            block2_sub_title2: handleRemoveEmptyKey({
              ...resData?.footer?.block2_sub_title2,
              [language]: data.footer_block_two_link_two_title || "",
            }),
            block2_sub_link2: data.footer_block_two_link_two,

            block2_sub_title3: handleRemoveEmptyKey({
              ...resData?.footer?.block2_sub_title3,
              [language]: data.footer_block_two_link_three_title || "",
            }),
            block2_sub_link3: data.footer_block_two_link_three,

            block2_sub_title4: handleRemoveEmptyKey({
              ...resData?.footer?.block2_sub_title4,
              [language]: data.footer_block_two_link_four_title || "",
            }),
            block2_sub_link4: data.footer_block_two_link_four,

            block3_title: handleRemoveEmptyKey({
              ...resData?.footer?.block3_title,
              [language]: data.footer_block_three_title || "",
            }),

            block3_sub_title1: handleRemoveEmptyKey({
              ...resData?.footer?.block3_sub_title1,
              [language]: data.footer_block_three_link_one_title || "",
            }),
            block3_sub_link1: data.footer_block_three_link_one,

            block3_sub_title2: handleRemoveEmptyKey({
              ...resData?.footer?.block3_sub_title2,
              [language]: data.footer_block_three_link_two_title || "",
            }),
            block3_sub_link2: data.footer_block_three_link_two,

            block3_sub_title3: handleRemoveEmptyKey({
              ...resData?.footer?.block3_sub_title3,
              [language]: data.footer_block_three_link_three_title || "",
            }),
            block3_sub_link3: data.footer_block_three_link_three,

            block3_sub_title4: handleRemoveEmptyKey({
              ...resData?.footer?.block3_sub_title4,
              [language]: data.footer_block_three_link_four_title || "",
            }),
            block3_sub_link4: data.footer_block_three_link_four,

            footer_block_four_link_one: data.footer_block_four_link_one,
            block4_logo: footerLogo,
            block4_address: handleRemoveEmptyKey({
              ...resData?.footer?.block4_address,
              [language]: data.footer_block_four_address || "",
            }),
            social_facebook: data.social_facebook,
            social_twitter: data.social_twitter,
            social_pinterest: data.social_pinterest,
            social_linkedin: data.social_linkedin,
            social_whatsapp: data.social_whatsapp,
            payment_method_img: paymentImage,
            block4_phone: data.footer_block_four_phone,
            block4_email: data.footer_block_four_email,
            bottom_contact: data.footer_Bottom_Contact,
          },
          slug: {
            right_box_status: singleProductPageRightBox,

            // slug_page_card_icon_one: data.slug_page_card_icon_one,
            card_description_one: handleRemoveEmptyKey({
              ...resData?.slug?.card_description_one,
              [language]: data.slug_page_card_description_one || "",
            }),

            // slug_page_card_icon_two: data.slug_page_card_icon_two,
            card_description_two: handleRemoveEmptyKey({
              ...resData?.slug?.card_description_two,
              [language]: data.slug_page_card_description_two || "",
            }),

            // slug_page_card_icon_three: data.slug_page_card_icon_three,
            card_description_three: handleRemoveEmptyKey({
              ...resData?.slug?.card_description_three,
              [language]: data.slug_page_card_description_three || "",
            }),

            // slug_page_card_icon_four: data.slug_page_card_icon_four,
            card_description_four: handleRemoveEmptyKey({
              ...resData?.slug?.card_description_four,
              [language]: data.slug_page_card_description_four || "",
            }),

            // slug_page_card_icon_five: data.slug_page_card_icon_five,

            card_description_five: handleRemoveEmptyKey({
              ...resData?.slug?.card_description_five,
              [language]: data.slug_page_card_description_five || "",
            }),

            // slug_page_card_icon_six: data.slug_page_card_icon_six,

            card_description_six: handleRemoveEmptyKey({
              ...resData?.slug?.card_description_six,
              [language]: data.slug_page_card_description_six || "",
            }),

            // slug_page_card_icon_seven: data.slug_page_card_icon_seven,

            card_description_seven: handleRemoveEmptyKey({
              ...resData?.slug?.card_description_seven,
              [language]: data.slug_page_card_description_seven || "",
            }),
          },
          seo: {
            //for seo
            meta_img: metaImg,
            favicon: favicon,
            meta_title: data.meta_title,
            meta_description: data.meta_description,
            meta_url: data.meta_url,
            meta_keywords: data.meta_keywords,
          },
        },
      };

      // console.log(
      //   "storeCustomizationSettingData submit",
      //   storeCustomizationSettingData
      // );
      // setIsSubmitting(false);
      // return;

      if (!isSave) {
        console.log('Updating existing settings...');
        console.log('About to call updateStoreCustomizationSetting with data:', storeCustomizationSettingData);
        const res = await SettingServices.updateStoreCustomizationSetting(
          storeCustomizationSettingData
        );
        console.log('Update API response:', res);
        console.log('Update successful, setting isUpdate to true...');
        // await socket.emit("notification", {
        //   message: `storeCustomizationSetting setting added`,
        //   option: "storeCustomizationSetting",
        // });

        setIsUpdate(true);
        console.log('Setting isSubmitting to false...');
        setIsSubmitting(false);

        console.log('About to reload page...');
        window.location.reload();
        console.log('About to show success notification...');
        notifySuccess(res.message);
      } else {
        console.log('Creating new settings...');
        console.log('About to call addStoreCustomizationSetting with data:', storeCustomizationSettingData);
        const res = await SettingServices.addStoreCustomizationSetting(
          storeCustomizationSettingData
        );
        console.log('Create API response:', res);
        console.log('Create successful, setting isUpdate to true...');
        // await socket.emit("notification", {
        //   message: `storeCustomizationSetting setting updated`,
        //   option: "storeCustomizationSetting",
        // });

        setIsUpdate(true);
        console.log('Setting isSubmitting to false...');
        setIsSubmitting(false);

        console.log('About to reload page...');
        window.location.reload();
        console.log('About to show success notification...');
        notifySuccess(res.message);
      }
    } catch (err) {
      console.error('=== ERROR IN ONSUBMIT ===');
      console.error('Error object:', err);
      console.error('Error message:', err?.message);
      console.error('Error response:', err?.response);
      console.error('Error response data:', err?.response?.data);
      console.error('Error response message:', err?.response?.data?.message);
      
      notifyError(err ? err?.response?.data?.message : err?.message);
      console.log('Setting isSubmitting to false due to error...');
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const getStoreCustomizationData = async () => {
      try {
        const res = await SettingServices.getStoreCustomizationSetting();

        console.log("🔍 Admin App - API Response:", {
          hasData: !!res,
          dataKeys: Object.keys(res || {}),
          aboutUsExists: !!res?.about_us,
          aboutUsKeys: res?.about_us ? Object.keys(res.about_us) : [],
          title: res?.about_us?.title,
          branchesTitle: res?.about_us?.branches_title,
          teamTitle: res?.about_us?.team_title
        });

        if (res) {
          setIsSave(false);
          setResData(res);

          //navbar

          setCategoriesMenuLink(res?.navbar?.categories_menu_status);
          setAboutUsMenuLink(res?.navbar?.about_menu_status);
          setContactUsMenuLink(res?.navbar?.contact_menu_status);
          setOffersMenuLink(res?.navbar?.offers_menu_status);
          setFaqMenuLink(res?.navbar?.faq_status);
          setPrivacyPolicyMenuLink(res?.navbar?.privacy_policy_status);
          setTermsConditionsMenuLink(res?.navbar?.term_and_condition_status);
          setValue("help_text", res?.navbar?.help_text[language || "en"]);

          setValue("categories", res?.navbar?.categories[language || "en"]);
          setValue("about_us", res?.navbar?.about_us[language || "en"]);
          setValue("contact_us", res?.navbar?.contact_us[language || "en"]);
          setValue("offers", res?.navbar?.offers[language || "en"]);
          setValue("faq", res?.navbar?.faq[language || "en"]);
          setValue(
            "privacy_policy",
            res?.navbar?.privacy_policy[language || "en"]
          );
          setValue(
            "term_and_condition",
            res?.navbar?.term_and_condition[language || "en"]
          );

          setValue("pages", res?.navbar?.pages[language || "en"]);
          setValue("my_account", res?.navbar?.my_account[language || "en"]);
          setValue("login", res?.navbar?.login[language || "en"]);
          setValue("logout", res?.navbar?.logout[language || "en"]);
          setValue("checkout", res?.navbar?.checkout[language || "en"]);
          setHeaderLogo(res?.navbar?.logo);
          setValue("phone_number", res?.navbar?.phone);

          //home

          setPlaceHolderImage(res?.home?.place_holder_img);
          setQuickSectionImage(res?.home?.quick_delivery_img);
          setGetYourDailyNeedImageLeft(res?.home?.daily_need_img_left);
          setGetYourDailyNeedImageRight(res?.home?.daily_need_img_right);
          setGetButton1image(res?.home?.button1_img);
          setGetButton2image(res?.home?.button2_img);
          setIsCoupon(res?.home?.coupon_status);
          setIsSliderFullWidth(res?.home?.slider_width_status);
          setAllowPromotionBanner(res?.home?.promotion_banner_status);
          setPopularProducts(res?.home?.popular_products_status);
          setFeaturedCategories(res?.home?.featured_status);
          setQuickDelivery(res?.home?.delivery_status);
          setLatestDiscounted(res?.home?.discount_product_status);
          setDailyNeeds(res?.home?.daily_needs_status);
          setFeaturePromo(res?.home?.feature_promo_status);
          // setCouponList(res?.home?.discount_coupon_code);
          const discountCouponCode = res?.home?.discount_coupon_code?.map(
            (coupon) => {
              const newObj = {
                label: coupon,
                value: coupon,
              };
              return newObj;
            }
          );
          setCouponList(discountCouponCode || []);

          setValue(
            "discount_title",
            res?.home?.discount_title[language || "en"]
          );
          setValue(
            "promotion_title",
            res?.home?.promotion_title[language || "en"]
          );
          setValue(
            "promotion_description",
            res?.home?.promotion_description[language || "en"]
          );
          setValue(
            "promotion_button_name",
            res?.home?.promotion_button_name[language || "en"]
          );
          setValue("promotion_button_link", res?.home?.promotion_button_link);
          setValue("feature_title", res?.home?.feature_title[language || "en"]);
          setValue(
            "feature_description",
            res?.home?.feature_description[language || "en"]
          );
          setValue("feature_product_limit", res?.home?.feature_product_limit);
          setValue("popular_title", res?.home?.popular_title[language || "en"]);
          setValue(
            "popular_description",
            res?.home?.popular_description[language || "en"]
          );
          setValue("popular_product_limit", res?.home?.popular_product_limit);
          setValue(
            "quick_delivery_subtitle",
            res?.home?.quick_delivery_subtitle[language || "en"]
          );
          setValue(
            "quick_delivery_title",
            res?.home?.quick_delivery_title[language || "en"]
          );
          setValue(
            "quick_delivery_description",
            res?.home?.quick_delivery_description[language || "en"]
          );
          setValue(
            "quick_delivery_button",
            res?.home?.quick_delivery_button[language || "en"]
          );
          setValue("quick_delivery_link", res?.home?.quick_delivery_link);
          setValue(
            "latest_discount_title",
            res?.home?.latest_discount_title[language || "en"]
          );
          setValue(
            "latest_discount_description",
            res?.home?.latest_discount_description[language || "en"]
          );
          setValue(
            "latest_discount_product_limit",
            res?.home?.latest_discount_product_limit
          );
          setValue(
            "daily_need_title",
            res?.home?.daily_need_title[language || "en"]
          );
          setValue(
            "daily_need_description",
            res?.home?.daily_need_description[language || "en"]
          );
          setValue("daily_need_app_link", res?.home?.daily_need_app_link);
          setValue("daily_need_google_link", res?.home?.daily_need_google_link);

          //slider
          setSliderImage(res?.slider?.first_img);
          setSliderImageTwo(res?.slider?.second_img);
          setSliderImageThree(res?.slider?.third_img);
          setSliderImageFour(res?.slider?.four_img);
          setSliderImageFive(res?.slider?.five_img);
          setLeftRightArrow(res?.slider?.left_right_arrow);
          setBottomDots(res?.slider?.bottom_dots);
          setBothSliderOption(res?.slider?.both_slider);

          setValue("slider_title", res?.slider?.first_title[language || "en"]);
          setValue(
            "slider_description",
            res?.slider?.first_description[language || "en"]
          );
          setValue(
            "slider_button_name",
            res?.slider?.first_button[language || "en"]
          );
          setValue("slider_button_link", res?.slider?.first_link);
          setValue(
            "slider_title_two",
            res?.slider?.second_title[language || "en"]
          );
          setValue(
            "slider_description_two",
            res?.slider?.second_description[language || "en"]
          );
          setValue(
            "slider_button_name_two",
            res?.slider?.second_button[language || "en"]
          );
          setValue("slider_button_link_two", res?.slider?.second_link);
          setValue(
            "slider_title_three",
            res?.slider?.third_title[language || "en"]
          );
          setValue(
            "slider_description_three",
            res?.slider?.third_description[language || "en"]
          );
          setValue(
            "slider_button_name_three",
            res?.slider?.third_button[language || "en"]
          );
          setValue("slider_button_link_three", res?.slider?.third_link);
          setValue(
            "slider_title_four",
            res?.slider?.four_title[language || "en"]
          );
          setValue(
            "slider_description_four",
            res?.slider?.four_description[language || "en"]
          );
          setValue(
            "slider_button_name_four",
            res?.slider?.four_button[language || "en"]
          );
          setValue("slider_button_link_four", res?.slider?.four_link);
          setValue(
            "slider_title_five",
            res?.slider?.five_title[language || "en"]
          );
          setValue(
            "slider_description_five",
            res?.slider?.five_description[language || "en"]
          );
          setValue(
            "slider_button_name_five",
            res?.slider?.five_button[language || "en"]
          );
          setValue("slider_button_link_five", res?.slider?.five_link);

          //checkout
          setValue(
            "personal_details",
            res?.checkout?.personal_details[language || "en"]
          );
          setValue("first_name", res?.checkout?.first_name[language || "en"]);
          setValue("last_name", res?.checkout?.last_name[language || "en"]);
          setValue(
            "email_address",
            res?.checkout?.email_address[language || "en"]
          );
          setValue(
            "checkout_phone",
            res?.checkout?.checkout_phone[language || "en"]
          );
          setValue(
            "shipping_details",
            res?.checkout?.shipping_details[language || "en"]
          );
          setValue(
            "street_address",
            res?.checkout?.street_address[language || "en"]
          );
          setValue("city", res?.checkout?.city[language || "en"]);
          setValue("country", res?.checkout?.country[language || "en"]);
          setValue("zip_code", res?.checkout?.zip_code[language || "en"]);
          setValue(
            "shipping_cost",
            res?.checkout?.shipping_cost[language || "en"]
          );
          setValue(
            "shipping_name_one",
            res?.checkout?.shipping_name_one[language || "en"]
          );
          setValue(
            "shipping_one_desc",
            res?.checkout?.shipping_one_desc[language || "en"]
          );
          setValue("shipping_one_cost", res?.checkout?.shipping_one_cost);
          setValue(
            "shipping_name_two",
            res?.checkout?.shipping_name_two[language || "en"]
          );
          setValue(
            "shipping_two_desc",
            res?.checkout?.shipping_two_desc[language || "en"]
          );
          setValue("shipping_two_cost", res?.checkout?.shipping_two_cost);
          setValue(
            "payment_method",
            res?.checkout?.payment_method[language || "en"]
          );
          setValue(
            "continue_button",
            res?.checkout?.continue_button[language || "en"]
          );
          setValue(
            "confirm_button",
            res?.checkout?.confirm_button[language || "en"]
          );
          setValue(
            "order_summary",
            res?.checkout?.order_summary[language || "en"]
          );
          setValue(
            "apply_button",
            res?.checkout?.apply_button[language || "en"]
          );
          setValue("sub_total", res?.checkout?.sub_total[language || "en"]);
          setValue("discount", res?.checkout?.discount[language || "en"]);
          setValue("total_cost", res?.checkout?.total_cost[language || "en"]);

          // Distance-Based Shipping Settings
          setValue("store_latitude", res?.distanceBasedShipping?.store_latitude || "");
          setValue("store_longitude", res?.distanceBasedShipping?.store_longitude || "");
          setValue("base_shipping_cost", res?.distanceBasedShipping?.base_shipping_cost || "");
          setValue("cost_per_km", res?.distanceBasedShipping?.cost_per_km || "");
          setValue("max_delivery_distance", res?.distanceBasedShipping?.max_delivery_distance || "");
          setValue("free_delivery_radius", res?.distanceBasedShipping?.free_delivery_radius || "");
          setValue("min_order_free_delivery", res?.distanceBasedShipping?.min_order_free_delivery || "");
          setValue("enable_free_shipping", res?.distanceBasedShipping?.enable_free_shipping !== false); // Default to true

          //dashboard
          setValue(
            "invoice_message_first",
            res?.dashboard?.invoice_message_first[language || "en"]
          );
          setValue(
            "invoice_message_last",
            res?.dashboard?.invoice_message_last[language || "en"]
          );
          setValue(
            "print_button",
            res?.dashboard?.print_button[language || "en"]
          );
          setValue(
            "download_button",
            res?.dashboard?.download_button[language || "en"]
          );
          setValue(
            "dashboard_title",
            res?.dashboard?.dashboard_title[language || "en"]
          );
          setValue(
            "total_order",
            res?.dashboard?.total_order[language || "en"]
          );
          setValue(
            "pending_order",
            res?.dashboard?.pending_order[language || "en"]
          );
          setValue(
            "processing_order",
            res?.dashboard?.processing_order[language || "en"]
          );
          setValue(
            "complete_order",
            res?.dashboard?.complete_order[language || "en"]
          );
          setValue(
            "recent_order",
            res?.dashboard?.recent_order[language || "en"]
          );
          setValue("my_order", res?.dashboard?.my_order[language || "en"]);
          setValue(
            "update_profile",
            res?.dashboard?.update_profile[language || "en"]
          );
          setValue("full_name", res?.dashboard?.full_name[language || "en"]);
          setValue("address", res?.dashboard?.address[language || "en"]);
          setValue("user_phone", res?.dashboard?.user_phone[language || "en"]);
          setValue("user_email", res?.dashboard?.user_email[language || "en"]);
          setValue(
            "update_button",
            res?.dashboard?.update_button[language || "en"]
          );
          setValue(
            "current_password",
            res?.dashboard?.current_password[language || "en"]
          );
          setValue(
            "new_password",
            res?.dashboard?.new_password[language || "en"]
          );
          setValue(
            "change_password",
            res?.dashboard?.change_password[language || "en"]
          );

          //footer
          setFooterBlock1(res?.footer?.block1_status);
          setFooterBlock2(res?.footer?.block2_status);
          setFooterBlock3(res?.footer?.block3_status);
          setFooterBlock4(res?.footer?.block4_status);
          setFooterLogo(res?.footer?.block4_logo);
          setPaymentImage(res?.footer?.payment_method_img);
          setFooterSocialLinks(res?.footer?.social_links_status);
          setFooterPaymentMethod(res?.footer?.payment_method_status);
          setFooterBottomContact(res?.footer?.bottom_contact_status);

          setValue(
            "promo_free_shipping",
            res?.footer?.shipping_card[language || "en"]
          );
          setValue(
            "promo_support",
            res?.footer?.support_card[language || "en"]
          );
          setValue(
            "promo_payment",
            res?.footer?.payment_card[language || "en"]
          );
          setValue("promo_offer", res?.footer?.offer_card[language || "en"]);
          setValue(
            "footer_block_one_title",
            res?.footer?.block1_title[language || "en"]
          );

          setValue("footer_block_one_link_one", res?.footer?.block1_sub_link1);
          setValue("footer_block_one_link_two", res?.footer?.block1_sub_link2);
          setValue(
            "footer_block_one_link_three",
            res?.footer?.block1_sub_link3
          );
          setValue("footer_block_one_link_four", res?.footer?.block1_sub_link4);

          setValue(
            "footer_block_one_link_one_title",
            res?.footer?.block1_sub_title1[language || "en"]
          );
          setValue(
            "footer_block_one_link_two_title",
            res?.footer?.block1_sub_title2[language || "en"]
          );
          setValue(
            "footer_block_one_link_three_title",
            res?.footer?.block1_sub_title3[language || "en"]
          );
          setValue(
            "footer_block_one_link_four_title",
            res?.footer?.block1_sub_title4[language || "en"]
          );

          setValue(
            "footer_block_two_title",
            res?.footer?.block2_title[language || "en"]
          );
          setValue("footer_block_two_link_one", res?.footer?.block2_sub_link1);
          setValue("footer_block_two_link_two", res?.footer?.block2_sub_link2);
          setValue(
            "footer_block_two_link_three",
            res?.footer?.block2_sub_link3
          );
          setValue("footer_block_two_link_four", res?.footer?.block2_sub_link4);

          setValue(
            "footer_block_two_link_one_title",
            res?.footer?.block2_sub_title1[language || "en"]
          );
          setValue(
            "footer_block_two_link_two_title",
            res?.footer?.block2_sub_title2[language || "en"]
          );
          setValue(
            "footer_block_two_link_three_title",
            res?.footer?.block2_sub_title3[language || "en"]
          );
          setValue(
            "footer_block_two_link_four_title",
            res?.footer?.block2_sub_title4[language || "en"]
          );

          setValue(
            "footer_block_three_title",
            res?.footer?.block3_title[language || "en"]
          );
          setValue(
            "footer_block_three_link_one",
            res?.footer?.block3_sub_link1
          );
          setValue(
            "footer_block_three_link_two",
            res?.footer?.block3_sub_link2
          );
          setValue(
            "footer_block_three_link_three",
            res?.footer?.block3_sub_link3
          );
          setValue(
            "footer_block_three_link_four",
            res?.footer?.block3_sub_link4
          );

          setValue(
            "footer_block_three_link_one_title",
            res?.footer?.block3_sub_title1[language || "en"]
          );
          setValue(
            "footer_block_three_link_two_title",
            res?.footer?.block3_sub_title2[language || "en"]
          );
          setValue(
            "footer_block_three_link_three_title",
            res?.footer?.block3_sub_title3[language || "en"]
          );
          setValue(
            "footer_block_three_link_four_title",
            res?.footer?.block3_sub_title4[language || "en"]
          );

          setValue(
            "footer_block_four_address",
            res?.footer?.block4_address[language || "en"]
          );
          setValue("footer_block_four_phone", res?.footer?.block4_phone);
          setValue("footer_block_four_email", res?.footer?.block4_email);

          setValue("social_facebook", res?.footer?.social_facebook);
          setValue("social_twitter", res?.footer?.social_twitter);
          setValue("social_pinterest", res?.footer?.social_pinterest);
          setValue("social_linkedin", res?.footer?.social_linkedin);
          setValue("social_whatsapp", res?.footer?.social_whatsapp);
          setValue("footer_Bottom_Contact", res?.footer?.bottom_contact);

          // slug
          setSingleProductPageRightBox(res?.slug?.right_box_status);
          setValue(
            "slug_page_card_icon_one",
            res?.slug?.slug_page_card_icon_one
          );
          setValue(
            "slug_page_card_description_one",
            res?.slug?.card_description_one[language || "en"]
          );

          setValue(
            "slug_page_card_icon_two",
            res?.slug?.slug_page_card_icon_two
          );
          setValue(
            "slug_page_card_description_two",
            res?.slug?.card_description_two[language || "en"]
          );

          setValue(
            "slug_page_card_icon_three",
            res?.slug?.slug_page_card_icon_three
          );
          setValue(
            "slug_page_card_description_three",
            res?.slug?.card_description_three[language || "en"]
          );

          setValue(
            "slug_page_card_icon_four",
            res?.slug?.slug_page_card_icon_four
          );
          setValue(
            "slug_page_card_description_four",
            res?.slug?.card_description_four[language || "en"]
          );

          setValue(
            "slug_page_card_icon_five",
            res?.slug?.slug_page_card_icon_five
          );
          setValue(
            "slug_page_card_description_five",
            res?.slug?.card_description_five[language || "en"]
          );

          setValue(
            "slug_page_card_icon_six",
            res?.slug?.slug_page_card_icon_six
          );
          setValue(
            "slug_page_card_description_six",
            res?.slug?.card_description_six[language || "en"]
          );

          setValue(
            "slug_page_card_icon_seven",
            res?.slug?.slug_page_card_icon_seven
          );
          setValue(
            "slug_page_card_description_seven",
            res?.slug?.card_description_seven[language || "en"]
          );

          // about us
          console.log("🔍 Setting About Us form values...");
          console.log("Header status:", res?.about_us?.header_status);
          console.log("Title:", res?.about_us?.title);
          console.log("Branches title:", res?.about_us?.branches_title);

          setAboutPageHeader(res?.about_us?.header_status);
          setAboutHeaderBg(res?.about_us?.header_bg);
          setAboutTopContentLeft(res?.about_us?.content_left_status);
          setAboutTopContentRight(res?.about_us?.content_right_status);
          setAboutTopContentRightImage(res?.about_us?.top_section_image);
          setAboutMiddleContentSection(res?.about_us?.content_middle_status);
          setAboutMiddleContentImage(res?.about_us?.content_middle_Img);
          setOurFounderSection(res?.about_us?.founder_status);
          setOurFounderOneImage(res?.about_us?.founder_one_img);
          setOurFounderTwoImage(res?.about_us?.founder_two_img);
          setOurFounderThreeImage(res?.about_us?.founder_three_img);
          setOurFounderFourImage(res?.about_us?.founder_four_img);
          setOurFounderFiveImage(res?.about_us?.founder_five_img);
          setOurFounderSixImage(res?.about_us?.founder_six_img);
          console.log("Setting about_page_title:", res?.about_us?.title);
          setValue("about_page_title", res?.about_us?.title?.[language || "en"] || "");
          console.log("Setting about_page_top_section_title:", res?.about_us?.top_section_title);
          setValue(
            "about_page_top_section_title",
            res?.about_us?.top_section_title?.[language || "en"] || ""
          );
          setValue(
            "about_us_top_description",
            res?.about_us?.top_description[language || "en"]
          );
          console.log("Setting about_page_card_one_title:", res?.about_us?.card_one_title);
          setValue(
            "about_page_card_one_title",
            res?.about_us?.card_one_title?.[language || "en"] || ""
          );
          setValue(
            "about_page_card_one_subtitle",
            res?.about_us?.card_one_sub?.[language || "en"] || ""
          );
          setValue(
            "about_page_card_one_description",
            res?.about_us?.card_one_description?.[language || "en"] || ""
          );
          console.log("Setting about_page_card_two_title:", res?.about_us?.card_two_title);
          setValue(
            "about_page_card_two_title",
            res?.about_us?.card_two_title?.[language || "en"] || ""
          );
          setValue(
            "about_page_card_two_subtitle",
            res?.about_us?.card_two_sub?.[language || "en"] || ""
          );
          console.log("Setting about_page_card_two_description:", res?.about_us?.card_two_description);
          setValue(
            "about_page_card_two_description",
            res?.about_us?.card_two_description?.[language || "en"] || ""
          );
          setValue(
            "about_us_middle_description_one",
            res?.about_us?.middle_description_one?.[language || "en"] || ""
          );
          setValue(
            "about_us_middle_description_two",
            res?.about_us?.middle_description_two?.[language || "en"] || ""
          );
          setValue(
            "about_page_team_title",
            res?.about_us?.team_title?.[language || "en"] || ""
          );
          setValue(
            "about_page_team_description",
            res?.about_us?.team_description?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_one_name",
            res?.about_us?.founder_one_name?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_one_position",
            res?.about_us?.founder_one_sub?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_two_name",
            res?.about_us?.founder_two_name?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_two_position",
            res?.about_us?.founder_two_position?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_three_name",
            res?.about_us?.founder_three_name?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_three_position",
            res?.about_us?.founder_three_position?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_four_name",
            res?.about_us?.founder_four_name?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_four_position",
            res?.about_us?.founder_four_position?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_five_name",
            res?.about_us?.founder_five_name?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_five_position",
            res?.about_us?.founder_five_position?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_six_name",
            res?.about_us?.founder_six_name?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_six_position",
            res?.about_us?.founder_six_position?.[language || "en"] || ""
          );

          // Additional founder fields (7-12)
          setValue(
            "about_page_founder_seven_name",
            res?.about_us?.founder_seven_name?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_seven_position",
            res?.about_us?.founder_seven_position?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_eight_name",
            res?.about_us?.founder_eight_name?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_eight_position",
            res?.about_us?.founder_eight_position?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_nine_name",
            res?.about_us?.founder_nine_name?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_nine_position",
            res?.about_us?.founder_nine_position?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_ten_name",
            res?.about_us?.founder_ten_name?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_ten_position",
            res?.about_us?.founder_ten_position?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_eleven_name",
            res?.about_us?.founder_eleven_name?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_eleven_position",
            res?.about_us?.founder_eleven_position?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_twelve_name",
            res?.about_us?.founder_twelve_name?.[language || "en"] || ""
          );
          setValue(
            "about_page_founder_twelve_position",
            res?.about_us?.founder_twelve_position?.[language || "en"] || ""
          );

          // Values section fields
          setValue(
            "about_page_values_title",
            res?.about_us?.values_title?.[language || "en"] || ""
          );
          setValue(
            "about_page_values_description",
            res?.about_us?.values_description?.[language || "en"] || ""
          );
          setValue(
            "about_page_value_one_title",
            res?.about_us?.value_one_title?.[language || "en"] || ""
          );
          setValue(
            "about_page_value_one_description",
            res?.about_us?.value_one_description?.[language || "en"] || ""
          );
          setValue(
            "about_page_value_two_title",
            res?.about_us?.value_two_title?.[language || "en"] || ""
          );
          setValue(
            "about_page_value_two_description",
            res?.about_us?.value_two_description?.[language || "en"] || ""
          );
          setValue(
            "about_page_value_three_title",
            res?.about_us?.value_three_title?.[language || "en"] || ""
          );
          setValue(
            "about_page_value_three_description",
            res?.about_us?.value_three_description?.[language || "en"] || ""
          );
          setValue(
            "about_page_value_four_title",
            res?.about_us?.value_four_title?.[language || "en"] || ""
          );
          setValue(
            "about_page_value_four_description",
            res?.about_us?.value_four_description?.[language || "en"] || ""
          );

          // Leadership section fields
          setValue(
            "about_page_leadership_title",
            res?.about_us?.leadership_title?.[language || "en"] || ""
          );
          setValue(
            "about_page_leadership_subtitle",
            res?.about_us?.leadership_subtitle?.[language || "en"] || ""
          );

          // Heritage section fields
          setValue(
            "about_page_heritage_title",
            res?.about_us?.heritage_title?.[language || "en"] || ""
          );
          setValue(
            "about_page_heritage_description_one",
            res?.about_us?.heritage_description_one?.[language || "en"] || ""
          );
          setValue(
            "about_page_heritage_description_two",
            res?.about_us?.heritage_description_two?.[language || "en"] || ""
          );

          // Hero section fields
          setValue(
            "about_page_hero_description",
            res?.about_us?.hero_description?.[language || "en"] || ""
          );

          // Trusted badges
          setValue(
            "about_page_trusted_badge_one_pill",
            res?.about_us?.trusted_badge_one_pill?.[language || "en"] || ""
          );
          setValue(
            "about_page_trusted_badge_one_text",
            res?.about_us?.trusted_badge_one_text?.[language || "en"] || ""
          );
          setValue(
            "about_page_trusted_badge_two_pill",
            res?.about_us?.trusted_badge_two_pill?.[language || "en"] || ""
          );
          setValue(
            "about_page_trusted_badge_two_text",
            res?.about_us?.trusted_badge_two_text?.[language || "en"] || ""
          );

          //contact us
          setContactPageHeader(res?.contact_us?.header_status);
          setContactHeaderBg(res?.contact_us?.header_bg);
          setEmailUsBox(res?.contact_us?.email_box_status);
          setCallUsBox(res?.contact_us?.call_box_status);
          setAddressBox(res?.contact_us?.address_box_status);
          setContactMidLeftColStatus(res?.contact_us?.left_col_status);
          setContactMidLeftColImage(res?.contact_us?.left_col_img);
          setContactFormStatus(res?.contact_us?.form_status);
          setValue(
            "contact_page_title",
            res?.contact_us?.title[language || "en"]
          );
          setValue(
            "email_box_title",
            res?.contact_us?.email_box_title[language || "en"]
          );
          setValue(
            "email_box_email",
            res?.contact_us?.email_box_email[language || "en"]
          );
          setValue(
            "email_box_text",
            res?.contact_us?.email_box_text[language || "en"]
          );
          setValue(
            "callUs_box_title",
            res?.contact_us?.call_box_title[language || "en"]
          );
          setValue(
            "callUs_box_phone",
            res?.contact_us?.call_box_phone[language || "en"]
          );
          setValue(
            "callUs_box_text",
            res?.contact_us?.call_box_text[language || "en"]
          );
          setValue(
            "address_box_title",
            res?.contact_us?.address_box_title[language || "en"]
          );
          setValue(
            "address_box_address_one",
            res?.contact_us?.address_box_address_one[language || "en"]
          );
          setValue(
            "address_box_address_two",
            res?.contact_us?.address_box_address_two[language || "en"]
          );
          setValue(
            "address_box_address_three",
            res?.contact_us?.address_box_address_three[language || "en"]
          );
          setValue(
            "contact_form_title",
            res?.contact_us?.form_title[language || "en"]
          );
          setValue(
            "contact_form_description",
            res?.contact_us?.form_description[language || "en"]
          );

          //privacy policy
          setPrivacyPolicy(res?.privacy_policy?.status);
          setPrivacyPolicyHeaderBg(res?.privacy_policy?.header_bg);
          setValue(
            "privacy_page_title",
            res?.privacy_policy?.title[language || "en"]
          );

          setTextEdit(
            createEditorState(
              showingTranslateValue(res?.privacy_policy?.description)
            )
          );

          // NEW: populate additional Privacy Policy fields so they persist after refresh
          setValue(
            "pp_effective_date",
            res?.privacy_policy?.effective_date || ""
          );
          setValue(
            "pp_last_updated",
            res?.privacy_policy?.last_updated || ""
          );
          setValue(
            "pp_tagline",
            res?.privacy_policy?.tagline ? res?.privacy_policy?.tagline[language || "en"] : ""
          );
          // CTA fields
          setValue(
            "pp_cta_title",
            res?.privacy_policy?.cta_title ? res?.privacy_policy?.cta_title[language || "en"] : ""
          );
          setValue(
            "pp_cta_desc",
            res?.privacy_policy?.cta_desc ? res?.privacy_policy?.cta_desc[language || "en"] : ""
          );
          setValue(
            "pp_cta_btn_text",
            res?.privacy_policy?.cta_btn_text ? res?.privacy_policy?.cta_btn_text[language || "en"] : ""
          );
          setValue(
            "pp_cta_btn_link",
            res?.privacy_policy?.cta_btn_link || ""
          );
          // Dynamic Privacy Policy Sections (1-12)
          const ppSectionWords = [
            "one",
            "two",
            "three",
            "four",
            "five",
            "six",
            "seven",
            "eight",
            "nine",
            "ten",
            "eleven",
            "twelve",
          ];
          ppSectionWords.forEach((word, idx) => {
            setValue(
              `pp_section_${idx + 1}_title`,
              res?.privacy_policy?.[`section_${word}_title`]
                ? res?.privacy_policy?.[`section_${word}_title`][language || "en"]
                : ""
            );
            setValue(
              `pp_section_${idx + 1}_body`,
              res?.privacy_policy?.[`section_${word}_body`]
                ? res?.privacy_policy?.[`section_${word}_body`][language || "en"]
                : ""
            );
          });
          // Privacy Policy Rights Boxes (1-6)
          for (let i = 1; i <= 6; i++) {
            setValue(
              `pp_right_${i}_name`,
              res?.privacy_policy?.[`right_${i}_name`]
                ? res?.privacy_policy?.[`right_${i}_name`][language || "en"]
                : ""
            );
            setValue(
              `pp_right_${i}_desc`,
              res?.privacy_policy?.[`right_${i}_desc`]
                ? res?.privacy_policy?.[`right_${i}_desc`][language || "en"]
                : ""
            );
            setValue(
              `pp_right_${i}_emoji`,
              res?.privacy_policy?.[`right_${i}_emoji`] || ""
            );
          }

          //term and condition
          setTermsConditions(res?.term_and_condition?.status);
          setTermsConditionsHeaderBg(res?.term_and_condition?.header_bg);
          setValue(
            "termsConditions_page_title",
            res?.term_and_condition?.title[language || "en"]
          );

          setTermsConditionsTextEdit(
            createEditorState(
              showingTranslateValue(res?.term_and_condition?.description)
            )
          );

          // NEW: populate additional Terms & Conditions fields
          setValue(
            "tc_effective_date",
            res?.term_and_condition?.effective_date || ""
          );
          setValue(
            "tc_last_updated",
            res?.term_and_condition?.last_updated || ""
          );
          // CTA fields
          setValue(
            "tc_cta_title",
            res?.term_and_condition?.cta_title ? res?.term_and_condition?.cta_title[language || "en"] : ""
          );
          setValue(
            "tc_cta_desc",
            res?.term_and_condition?.cta_desc ? res?.term_and_condition?.cta_desc[language || "en"] : ""
          );
          setValue(
            "tc_cta_btn_text",
            res?.term_and_condition?.cta_btn_text ? res?.term_and_condition?.cta_btn_text[language || "en"] : ""
          );
          setValue(
            "tc_cta_btn_link",
            res?.term_and_condition?.cta_btn_link || ""
          );
          // Dynamic Terms & Conditions Sections (1-15)
          const tcSectionWords = [
            "one",
            "two",
            "three",
            "four",
            "five",
            "six",
            "seven",
            "eight",
            "nine",
            "ten",
            "eleven",
            "twelve",
            "thirteen",
            "fourteen",
            "fifteen",
          ];
          tcSectionWords.forEach((word, idx) => {
            setValue(
              `tc_section_${idx + 1}_title`,
              res?.term_and_condition?.[`section_${word}_title`]
                ? res?.term_and_condition?.[`section_${word}_title`][language || "en"]
                : ""
            );
            setValue(
              `tc_section_${idx + 1}_body`,
              res?.term_and_condition?.[`section_${word}_body`]
                ? res?.term_and_condition?.[`section_${word}_body`][language || "en"]
                : ""
            );
          });

          //faq
          setFaqStatus(res?.faq?.page_status);
          setFaqHeaderBg(res?.faq?.header_bg);
          setFaqLeftColImage(res?.faq?.left_img);
          setFaqLeftColStatus(res?.faq?.leftcol_status);
          setFaqRightColStatus(res?.faq?.rightcol_status);
          setValue("faq_page_title", res?.faq?.title[language || "en"]);
          setValue("faq_title_one", res?.faq?.faq_one[language || "en"]);
          setValue(
            "faq_description_one",
            res?.faq?.description_one[language || "en"]
          );
          setValue("faq_title_two", res?.faq?.faq_two[language || "en"]);
          setValue(
            "faq_description_two",
            res?.faq?.description_two[language || "en"]
          );
          setValue("faq_title_three", res?.faq?.faq_three[language || "en"]);
          setValue(
            "faq_description_three",
            res?.faq?.description_three[language || "en"]
          );
          setValue("faq_title_four", res?.faq?.faq_four[language || "en"]);
          setValue(
            "faq_description_four",
            res?.faq?.description_four[language || "en"]
          );
          setValue("faq_title_five", res?.faq?.faq_five[language || "en"]);
          setValue(
            "faq_description_five",
            res?.faq?.description_five[language || "en"]
          );
          setValue("faq_title_six", res?.faq?.faq_six[language || "en"]);
          setValue(
            "faq_description_six",
            res?.faq?.description_six[language || "en"]
          );
          setValue("faq_title_seven", res?.faq?.faq_seven[language || "en"]);
          setValue(
            "faq_description_seven",
            res?.faq?.description_seven[language || "en"]
          );
          setValue("faq_title_eight", res?.faq?.faq_eight[language || "en"]);
          setValue(
            "faq_description_eight",
            res?.faq?.description_eight[language || "en"]
          );

          //offers
          setOffersPageHeader(res?.offers?.header_status);
          setOffersHeaderBg(res?.offers?.header_bg);

          setValue("offers_page_title", res?.offers?.title[language || "en"]);
          // setValue('offers_coupon_code', res.offers_coupon_code);
          // setCouponList1(res?.offers?.coupon_code);
          const coupon_code = res?.offers?.coupon_code?.map((coupon) => {
            const newObj = {
              label: coupon,
              value: coupon,
            };
            return newObj;
          });
          setCouponList1(coupon_code || []);
          const resCoupon = await CouponServices.getAllCoupons();
          const result = resCoupon?.map((coupon) => {
            const newObj = {
              label: coupon?.couponCode,
              value: coupon?.couponCode,
            };
            return newObj;
          });
          setCoupons(result);

          //for seo
          setMetaImg(res.seo.meta_img);
          setFavicon(res.seo.favicon);
          setValue("meta_title", res.seo.meta_title);
          setValue("meta_description", res.seo.meta_description);
          setValue("meta_keywords", res.seo.meta_keywords);
          setValue("meta_url", res.seo.meta_url);

          // Core Values
          setValue(
            "about_page_values_title",
            res?.about_us?.values_title ? res?.about_us?.values_title[language || "en"] : ""
          );
          setValue(
            "about_page_values_description",
            res?.about_us?.values_description ? res?.about_us?.values_description[language || "en"] : ""
          );

          // Heritage Section
          setValue(
            "about_page_heritage_title",
            res?.about_us?.heritage_title ? res?.about_us?.heritage_title[language || "en"] : ""
          );
          setValue(
            "about_page_heritage_description_one",
            res?.about_us?.heritage_description_one ? res?.about_us?.heritage_description_one[language || "en"] : ""
          );
          setValue(
            "about_page_heritage_description_two",
            res?.about_us?.heritage_description_two ? res?.about_us?.heritage_description_two[language || "en"] : ""
          );

          // Team Section
          setValue(
            "about_page_team_title",
            res?.about_us?.team_title ? res?.about_us?.team_title[language || "en"] : ""
          );
          setValue(
            "about_page_team_description",
            res?.about_us?.team_description ? res?.about_us?.team_description[language || "en"] : ""
          );
          setValue(
            "about_page_leadership_title",
            res?.about_us?.leadership_title ? res?.about_us?.leadership_title[language || "en"] : ""
          );
          setValue(
            "about_page_leadership_subtitle",
            res?.about_us?.leadership_subtitle ? res?.about_us?.leadership_subtitle[language || "en"] : ""
          );

          // Core Values
          setValue(
            "about_page_value_one_title",
            res?.about_us?.value_one_title ? res?.about_us?.value_one_title[language || "en"] : ""
          );
          setValue(
            "about_page_value_one_description",
            res?.about_us?.value_one_description ? res?.about_us?.value_one_description[language || "en"] : ""
          );
          setValue(
            "about_page_value_two_title",
            res?.about_us?.value_two_title ? res?.about_us?.value_two_title[language || "en"] : ""
          );
          setValue(
            "about_page_value_two_description",
            res?.about_us?.value_two_description ? res?.about_us?.value_two_description[language || "en"] : ""
          );
          setValue(
            "about_page_value_three_title",
            res?.about_us?.value_three_title ? res?.about_us?.value_three_title[language || "en"] : ""
          );
          setValue(
            "about_page_value_three_description",
            res?.about_us?.value_three_description ? res?.about_us?.value_three_description[language || "en"] : ""
          );
          setValue(
            "about_page_value_four_title",
            res?.about_us?.value_four_title ? res?.about_us?.value_four_title[language || "en"] : ""
          );
          setValue(
            "about_page_value_four_description",
            res?.about_us?.value_four_description ? res?.about_us?.value_four_description[language || "en"] : ""
          );

          // Team Members
          setValue(
            "about_page_founder_one_name",
            res?.about_us?.founder_one_name ? res?.about_us?.founder_one_name[language || "en"] : ""
          );
          setValue(
            "about_page_founder_one_position",
            res?.about_us?.founder_one_position ? res?.about_us?.founder_one_position[language || "en"] : ""
          );
          setValue(
            "about_page_founder_two_name",
            res?.about_us?.founder_two_name ? res?.about_us?.founder_two_name[language || "en"] : ""
          );
          setValue(
            "about_page_founder_two_position",
            res?.about_us?.founder_two_position ? res?.about_us?.founder_two_position[language || "en"] : ""
          );
          setValue(
            "about_page_founder_three_name",
            res?.about_us?.founder_three_name ? res?.about_us?.founder_three_name[language || "en"] : ""
          );
          setValue(
            "about_page_founder_three_position",
            res?.about_us?.founder_three_position ? res?.about_us?.founder_three_position[language || "en"] : ""
          );
          setValue(
            "about_page_founder_four_name",
            res?.about_us?.founder_four_name ? res?.about_us?.founder_four_name[language || "en"] : ""
          );
          setValue(
            "about_page_founder_four_position",
            res?.about_us?.founder_four_position ? res?.about_us?.founder_four_position[language || "en"] : ""
          );
          setValue(
            "about_page_founder_five_name",
            res?.about_us?.founder_five_name ? res?.about_us?.founder_five_name[language || "en"] : ""
          );
          setValue(
            "about_page_founder_five_position",
            res?.about_us?.founder_five_position ? res?.about_us?.founder_five_position[language || "en"] : ""
          );
          setValue(
            "about_page_founder_six_name",
            res?.about_us?.founder_six_name ? res?.about_us?.founder_six_name[language || "en"] : ""
          );
          setValue(
            "about_page_founder_six_position",
            res?.about_us?.founder_six_position ? res?.about_us?.founder_six_position[language || "en"] : ""
          );
          setValue(
            "about_page_founder_seven_name",
            res?.about_us?.founder_seven_name ? res?.about_us?.founder_seven_name[language || "en"] : ""
          );
          setValue(
            "about_page_founder_seven_position",
            res?.about_us?.founder_seven_position ? res?.about_us?.founder_seven_position[language || "en"] : ""
          );
          setValue(
            "about_page_founder_eight_name",
            res?.about_us?.founder_eight_name ? res?.about_us?.founder_eight_name[language || "en"] : ""
          );
          setValue(
            "about_page_founder_eight_position",
            res?.about_us?.founder_eight_position ? res?.about_us?.founder_eight_position[language || "en"] : ""
          );
          setValue(
            "about_page_founder_nine_name",
            res?.about_us?.founder_nine_name ? res?.about_us?.founder_nine_name[language || "en"] : ""
          );
          setValue(
            "about_page_founder_nine_position",
            res?.about_us?.founder_nine_position ? res?.about_us?.founder_nine_position[language || "en"] : ""
          );
          setValue(
            "about_page_founder_ten_name",
            res?.about_us?.founder_ten_name ? res?.about_us?.founder_ten_name[language || "en"] : ""
          );
          setValue(
            "about_page_founder_ten_position",
            res?.about_us?.founder_ten_position ? res?.about_us?.founder_ten_position[language || "en"] : ""
          );
          setValue(
            "about_page_founder_eleven_name",
            res?.about_us?.founder_eleven_name ? res?.about_us?.founder_eleven_name[language || "en"] : ""
          );
          setValue(
            "about_page_founder_eleven_position",
            res?.about_us?.founder_eleven_position ? res?.about_us?.founder_eleven_position[language || "en"] : ""
          );
          setValue(
            "about_page_founder_twelve_name",
            res?.about_us?.founder_twelve_name ? res?.about_us?.founder_twelve_name[language || "en"] : ""
          );
          setValue(
            "about_page_founder_twelve_position",
            res?.about_us?.founder_twelve_position ? res?.about_us?.founder_twelve_position[language || "en"] : ""
          );

          // Branches
          setValue(
            "about_page_branches_title",
            res?.about_us?.branches_title ? res?.about_us?.branches_title[language || "en"] : ""
          );
          setValue(
            "about_page_branches_description",
            res?.about_us?.branches_description ? res?.about_us?.branches_description[language || "en"] : ""
          );
          setValue(
            "about_page_branches_cta_title",
            res?.about_us?.branches_cta_title ? res?.about_us?.branches_cta_title[language || "en"] : ""
          );
          setValue(
            "about_page_branches_cta_description",
            res?.about_us?.branches_cta_description ? res?.about_us?.branches_cta_description[language || "en"] : ""
          );
          setValue(
            "about_page_upcoming_branches_title",
            res?.about_us?.upcoming_branches_title ? res?.about_us?.upcoming_branches_title[language || "en"] : ""
          );

          // Branch Data
          const branchWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
          branchWords.forEach((branchWord) => {
            setValue(
              `about_page_branch_${branchWord}_name`,
              res?.about_us?.[`branch_${branchWord}_name`] ? res?.about_us?.[`branch_${branchWord}_name`][language || "en"] : ""
            );
            setValue(
              `about_page_branch_${branchWord}_address`,
              res?.about_us?.[`branch_${branchWord}_address`] ? res?.about_us?.[`branch_${branchWord}_address`][language || "en"] : ""
            );
            setValue(
              `about_page_branch_${branchWord}_phone`,
              res?.about_us?.[`branch_${branchWord}_phone`] ? res?.about_us?.[`branch_${branchWord}_phone`][language || "en"] : ""
            );
            setValue(
              `about_page_branch_${branchWord}_hours`,
              res?.about_us?.[`branch_${branchWord}_hours`] ? res?.about_us?.[`branch_${branchWord}_hours`][language || "en"] : ""
            );
            // NEW: subtitle/type, services and directions link
            setValue(
              `about_page_branch_${branchWord}_subtitle`,
              res?.about_us?.[`branch_${branchWord}_subtitle`] ? res?.about_us?.[`branch_${branchWord}_subtitle`][language || "en"] : ""
            );
            setValue(
              `about_page_branch_${branchWord}_services`,
              res?.about_us?.[`branch_${branchWord}_services`] ? res?.about_us?.[`branch_${branchWord}_services`][language || "en"] : ""
            );
            setValue(
              `about_page_branch_${branchWord}_directions`,
              res?.about_us?.[`branch_${branchWord}_directions`] ? res?.about_us?.[`branch_${branchWord}_directions`][language || "en"] : ""
            );
          });

          // Initialize section toggles based on data presence
          if (res?.about_us?.values_title || res?.about_us?.value_one_title || res?.about_us?.value_two_title) {
            setAboutCoreValues(true);
          }
          
          // Check for branches_status first, then fall back to data presence
          if (res?.about_us?.branches_status !== undefined) {
            setAboutBranches(res.about_us.branches_status);
          } else if (res?.about_us?.branches_title || res?.about_us?.branch_one_name || res?.about_us?.upcoming_branches_title) {
            setAboutBranches(true);
          }

          // Upcoming Branches (static two)
          setValue(
            "about_page_upcoming_branch_one_name",
            res?.about_us?.upcoming_branch_one_name ? res?.about_us?.upcoming_branch_one_name[language || "en"] : ""
          );
          setValue(
            "about_page_upcoming_branch_one_address",
            res?.about_us?.upcoming_branch_one_address ? res?.about_us?.upcoming_branch_one_address[language || "en"] : ""
          );
          setValue(
            "about_page_upcoming_branch_two_name",
            res?.about_us?.upcoming_branch_two_name ? res?.about_us?.upcoming_branch_two_name[language || "en"] : ""
          );
          setValue(
            "about_page_upcoming_branch_two_address",
            res?.about_us?.upcoming_branch_two_address ? res?.about_us?.upcoming_branch_two_address[language || "en"] : ""
          );

          setValue(
            "about_page_upcoming_branch_one_quarter",
            res?.about_us?.upcoming_branch_one_quarter ? res?.about_us?.upcoming_branch_one_quarter[language || "en"] : ""
          );
          setValue(
            "about_page_upcoming_branch_one_features",
            res?.about_us?.upcoming_branch_one_features ? res?.about_us?.upcoming_branch_one_features[language || "en"] : ""
          );
          setValue(
            "about_page_upcoming_branch_one_emoji",
            res?.about_us?.upcoming_branch_one_emoji ? res?.about_us?.upcoming_branch_one_emoji[language || "en"] : ""
          );

          setValue(
            "about_page_upcoming_branch_two_quarter",
            res?.about_us?.upcoming_branch_two_quarter ? res?.about_us?.upcoming_branch_two_quarter[language || "en"] : ""
          );
          setValue(
            "about_page_upcoming_branch_two_features",
            res?.about_us?.upcoming_branch_two_features ? res?.about_us?.upcoming_branch_two_features[language || "en"] : ""
          );
          setValue(
            "about_page_upcoming_branch_two_emoji",
            res?.about_us?.upcoming_branch_two_emoji ? res?.about_us?.upcoming_branch_two_emoji[language || "en"] : ""
          );
          setValue(
            "about_page_trusted_badge_one_pill",
            res?.about_us?.trusted_badge_one_pill ? res?.about_us?.trusted_badge_one_pill[language || "en"] : ""
          );
          setValue(
            "about_page_trusted_badge_one_text",
            res?.about_us?.trusted_badge_one_text ? res?.about_us?.trusted_badge_one_text[language || "en"] : ""
          );
          setValue(
            "about_page_trusted_badge_two_pill",
            res?.about_us?.trusted_badge_two_pill ? res?.about_us?.trusted_badge_two_pill[language || "en"] : ""
          );
          setValue(
            "about_page_trusted_badge_two_text",
            res?.about_us?.trusted_badge_two_text ? res?.about_us?.trusted_badge_two_text[language || "en"] : ""
          );
        }
      } catch (err) {
        notifyError(err ? err?.response?.data?.message : err?.message);
      }
    };
    getStoreCustomizationData();
    return () => {
      const controller = new AbortController();
      controller.abort();
    };
  }, [language, setValue]);

  const handleSelectLanguage = (lang) => {
    console.log("Language changed to:", lang);
    setLanguage(lang);
    
    // Update form fields with the new language data
    if (resData) {
      updateFormFieldsForLanguage(lang);
    }
  };

  // Function to update form fields for a specific language
  const updateFormFieldsForLanguage = (lang) => {
    console.log("Updating form fields for language:", lang);
    
    if (!resData?.about_us) {
      console.log("No about_us data available for language update");
      return;
    }
    
    // Update About Us fields with proper field mapping
    setValue("about_page_title", resData?.about_us?.title?.[lang] || "");
    setValue("about_page_hero_description", resData?.about_us?.hero_description?.[lang] || "");
    setValue("about_page_top_section_title", resData?.about_us?.top_section_title?.[lang] || "");
    setValue("about_page_top_section_description", resData?.about_us?.top_section_description?.[lang] || "");
    setValue("about_us_top_description", resData?.about_us?.top_description?.[lang] || "");
    setValue("about_page_card_one_title", resData?.about_us?.card_one_title?.[lang] || "");
    setValue("about_page_card_one_subtitle", resData?.about_us?.card_one_sub?.[lang] || "");
    setValue("about_page_card_one_description", resData?.about_us?.card_one_description?.[lang] || "");
    setValue("about_page_card_two_title", resData?.about_us?.card_two_title?.[lang] || "");
    setValue("about_page_card_two_subtitle", resData?.about_us?.card_two_sub?.[lang] || "");
    setValue("about_page_card_two_description", resData?.about_us?.card_two_description?.[lang] || "");
    setValue("about_us_middle_description_one", resData?.about_us?.middle_description_one?.[lang] || "");
    setValue("about_us_middle_description_two", resData?.about_us?.middle_description_two?.[lang] || "");
    
    // Team section
    setValue("about_page_team_title", resData?.about_us?.team_title?.[lang] || "");
    setValue("about_page_team_description", resData?.about_us?.team_description?.[lang] || "");
    
    // Leadership section
    setValue("about_page_leadership_title", resData?.about_us?.leadership_title?.[lang] || "");
    setValue("about_page_leadership_subtitle", resData?.about_us?.leadership_subtitle?.[lang] || "");
    
    // Values section
    setValue("about_page_values_title", resData?.about_us?.values_title?.[lang] || "");
    setValue("about_page_values_description", resData?.about_us?.values_description?.[lang] || "");
    setValue("about_page_value_one_title", resData?.about_us?.value_one_title?.[lang] || "");
    setValue("about_page_value_one_description", resData?.about_us?.value_one_description?.[lang] || "");
    setValue("about_page_value_two_title", resData?.about_us?.value_two_title?.[lang] || "");
    setValue("about_page_value_two_description", resData?.about_us?.value_two_description?.[lang] || "");
    setValue("about_page_value_three_title", resData?.about_us?.value_three_title?.[lang] || "");
    setValue("about_page_value_three_description", resData?.about_us?.value_three_description?.[lang] || "");
    setValue("about_page_value_four_title", resData?.about_us?.value_four_title?.[lang] || "");
    setValue("about_page_value_four_description", resData?.about_us?.value_four_description?.[lang] || "");
    
    // Heritage section
    setValue("about_page_heritage_title", resData?.about_us?.heritage_title?.[lang] || "");
    setValue("about_page_heritage_description_one", resData?.about_us?.heritage_description_one?.[lang] || "");
    setValue("about_page_heritage_description_two", resData?.about_us?.heritage_description_two?.[lang] || "");
    
    // Founder fields (1-12)
    setValue("about_page_founder_one_name", resData?.about_us?.founder_one_name?.[lang] || "");
    setValue("about_page_founder_one_position", resData?.about_us?.founder_one_sub?.[lang] || "");
    setValue("about_page_founder_two_name", resData?.about_us?.founder_two_name?.[lang] || "");
    setValue("about_page_founder_two_position", resData?.about_us?.founder_two_sub?.[lang] || "");
    setValue("about_page_founder_three_name", resData?.about_us?.founder_three_name?.[lang] || "");
    setValue("about_page_founder_three_position", resData?.about_us?.founder_three_sub?.[lang] || "");
    setValue("about_page_founder_four_name", resData?.about_us?.founder_four_name?.[lang] || "");
    setValue("about_page_founder_four_position", resData?.about_us?.founder_four_sub?.[lang] || "");
    setValue("about_page_founder_five_name", resData?.about_us?.founder_five_name?.[lang] || "");
    setValue("about_page_founder_five_position", resData?.about_us?.founder_five_sub?.[lang] || "");
    setValue("about_page_founder_six_name", resData?.about_us?.founder_six_name?.[lang] || "");
    setValue("about_page_founder_six_position", resData?.about_us?.founder_six_sub?.[lang] || "");
    setValue("about_page_founder_seven_name", resData?.about_us?.founder_seven_name?.[lang] || "");
    setValue("about_page_founder_seven_position", resData?.about_us?.founder_seven_position?.[lang] || "");
    setValue("about_page_founder_eight_name", resData?.about_us?.founder_eight_name?.[lang] || "");
    setValue("about_page_founder_eight_position", resData?.about_us?.founder_eight_position?.[lang] || "");
    setValue("about_page_founder_nine_name", resData?.about_us?.founder_nine_name?.[lang] || "");
    setValue("about_page_founder_nine_position", resData?.about_us?.founder_nine_position?.[lang] || "");
    setValue("about_page_founder_ten_name", resData?.about_us?.founder_ten_name?.[lang] || "");
    setValue("about_page_founder_ten_position", resData?.about_us?.founder_ten_position?.[lang] || "");
    setValue("about_page_founder_eleven_name", resData?.about_us?.founder_eleven_name?.[lang] || "");
    setValue("about_page_founder_eleven_position", resData?.about_us?.founder_eleven_position?.[lang] || "");
    setValue("about_page_founder_twelve_name", resData?.about_us?.founder_twelve_name?.[lang] || "");
    setValue("about_page_founder_twelve_position", resData?.about_us?.founder_twelve_position?.[lang] || "");
    
    // Trusted badges
    setValue("about_page_trusted_badge_one_pill", resData?.about_us?.trusted_badge_one_pill?.[lang] || "");
    setValue("about_page_trusted_badge_one_text", resData?.about_us?.trusted_badge_one_text?.[lang] || "");
    setValue("about_page_trusted_badge_two_pill", resData?.about_us?.trusted_badge_two_pill?.[lang] || "");
    setValue("about_page_trusted_badge_two_text", resData?.about_us?.trusted_badge_two_text?.[lang] || "");
    
    // Branch fields
    setValue("about_page_branches_title", resData?.about_us?.branches_title?.[lang] || "");
    setValue("about_page_branches_description", resData?.about_us?.branches_description?.[lang] || "");
    setValue("about_page_branches_cta_title", resData?.about_us?.branches_cta_title?.[lang] || "");
    setValue("about_page_branches_cta_description", resData?.about_us?.branches_cta_description?.[lang] || "");
    setValue("about_page_upcoming_branches_title", resData?.about_us?.upcoming_branches_title?.[lang] || "");
    
    // Branch data (1-8)
    const branchWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
    branchWords.forEach((branchWord) => {
      setValue(
        `about_page_branch_${branchWord}_name`,
        resData?.about_us?.[`branch_${branchWord}_name`]?.[lang] || ""
      );
      setValue(
        `about_page_branch_${branchWord}_address`,
        resData?.about_us?.[`branch_${branchWord}_address`]?.[lang] || ""
      );
      setValue(
        `about_page_branch_${branchWord}_phone`,
        resData?.about_us?.[`branch_${branchWord}_phone`]?.[lang] || ""
      );
      setValue(
        `about_page_branch_${branchWord}_hours`,
        resData?.about_us?.[`branch_${branchWord}_hours`]?.[lang] || ""
      );
      setValue(
        `about_page_branch_${branchWord}_subtitle`,
        resData?.about_us?.[`branch_${branchWord}_subtitle`]?.[lang] || ""
      );
      setValue(
        `about_page_branch_${branchWord}_services`,
        resData?.about_us?.[`branch_${branchWord}_services`]?.[lang] || ""
      );
      setValue(
        `about_page_branch_${branchWord}_directions`,
        resData?.about_us?.[`branch_${branchWord}_directions`]?.[lang] || ""
      );
    });
    
    // Upcoming branches
    setValue("about_page_upcoming_branch_one_name", resData?.about_us?.upcoming_branch_one_name?.[lang] || "");
    setValue("about_page_upcoming_branch_one_address", resData?.about_us?.upcoming_branch_one_address?.[lang] || "");
    setValue("about_page_upcoming_branch_two_name", resData?.about_us?.upcoming_branch_two_name?.[lang] || "");
    setValue("about_page_upcoming_branch_two_address", resData?.about_us?.upcoming_branch_two_address?.[lang] || "");
    setValue("about_page_upcoming_branch_one_quarter", resData?.about_us?.upcoming_branch_one_quarter?.[lang] || "");
    setValue("about_page_upcoming_branch_one_features", resData?.about_us?.upcoming_branch_one_features?.[lang] || "");
    setValue("about_page_upcoming_branch_one_emoji", resData?.about_us?.upcoming_branch_one_emoji?.[lang] || "");
    setValue("about_page_upcoming_branch_two_quarter", resData?.about_us?.upcoming_branch_two_quarter?.[lang] || "");
    setValue("about_page_upcoming_branch_two_features", resData?.about_us?.upcoming_branch_two_features?.[lang] || "");
    setValue("about_page_upcoming_branch_two_emoji", resData?.about_us?.upcoming_branch_two_emoji?.[lang] || "");
    
    console.log("Form fields updated for language:", lang);
  };

  return {
    register,
    handleSubmit,
    onSubmit,
    setValue,
    control,
    errors,
    favicon,
    coupons,
    setFavicon,
    metaImg,
    setMetaImg,
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
    allowDiscount,
    setAllowDiscount,
    allowPromotionBanner,
    setAllowPromotionBanner,
    printSlip,
    setPrintSlip,
    orderProcess,
    setOrderProcess,
    paymentOption,
    setPaymentOption,
    isSave,
    allowOutOfStock,
    setAllowOutOfStock,
    isCoupon,
    isPlaceholder,
    isSliderFullWidth,
    setIsCoupon,
    setDiscount_coupon_status,
    discount_coupon_status,
    setIsPlaceholder,
    setIsSliderFullWidth,
    emailSlip,
    setEmailSlip,
    setPromotionBanner,
    promotionBanner,
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
    setSingleProductPageRightBox,
    singleProductPageRightBox,
    handleSelectLanguage,
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
    setAboutPageHeader,
    aboutPageHeader,
    setAboutTopContentLeft,
    aboutTopContentLeft,
    setAboutHeaderBg,
    aboutHeaderBg,
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
    // Additional founder images
    ourFounderSevenImage,
    setOurFounderSevenImage,
    ourFounderEightImage,
    setOurFounderEightImage,
    ourFounderNineImage,
    setOurFounderNineImage,
    ourFounderTenImage,
    setOurFounderTenImage,
    ourFounderElevenImage,
    setOurFounderElevenImage,
    ourFounderTwelveImage,
    setOurFounderTwelveImage,
    // About Us section toggles
    aboutCoreValues,
    setAboutCoreValues,
    aboutBranches,
    setAboutBranches,
    ourFounderSixImage,
    setPrivacyPolicy,
    privacyPolicy,
    setPrivacyPolicyHeaderBg,
    privacyPolicyHeaderBg,
    setTermsConditions,
    termsConditions,
    setTermsConditionsHeaderBg,
    termsConditionsHeaderBg,
    setFaqStatus,
    faqStatus,
    setFaqLeftColStatus,
    faqLeftColStatus,
    setFaqRightColStatus,
    faqRightColStatus,
    setFaqHeaderBg,
    faqHeaderBg,
    setFaqLeftColImage,
    faqLeftColImage,
    setOffersPageHeader,
    offersPageHeader,
    setOffersHeaderBg,
    offersHeaderBg,
    setContactPageHeader,
    contactPageHeader,
    setContactHeaderBg,
    contactHeaderBg,
    setEmailUsBox,
    emailUsBox,
    setCallUsBox,
    callUsBox,
    setAddressBox,
    addressBox,
    setContactMidLeftColStatus,
    contactMidLeftColStatus,
    setContactMidLeftColImage,
    contactMidLeftColImage,
    setContactFormStatus,
    contactFormStatus,
    couponList,
    setCouponList,
    couponList1,
    setCouponList1,
    textEdit,
    setTextEdit,
    termsConditionsTextEdit,
    setTermsConditionsTextEdit,
    isSubmitting,
  };
};

export default useStoreHomeSubmit;
