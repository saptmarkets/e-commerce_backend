import React from 'react';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube, FaPinterest, FaWhatsapp, FaTiktok, FaSnapchatGhost, FaLink } from 'react-icons/fa';
import useHomepageSections from '@hooks/useHomepageSections';
import useUtilsFunction from '@hooks/useUtilsFunction';

const iconMap = {
  facebook: FaFacebookF,
  twitter: FaTwitter,
  instagram: FaInstagram,
  linkedin: FaLinkedinIn,
  youtube: FaYoutube,
  pinterest: FaPinterest,
  whatsapp: FaWhatsapp,
  tiktok: FaTiktok,
  snapchat: FaSnapchatGhost,
};

const SocialLinks = ({ className = '' }) => {
  const { getSection } = useHomepageSections();
  const { showingTranslateValue } = useUtilsFunction();
  const section = getSection('social_links');

  if (!section || !section.isActive) return null;

  const links = section.content?.links || [];

  const formatUrl = (u) => {
    if (!u) return '#';
    return /^https?:\/\//i.test(u) ? u : `https://${u.replace(/^\/+/, '')}`;
  };

  return (
    <ul className={`flex space-x-3 ${className}`}>
      {links.map((item, idx) => {
        const Icon = iconMap[item.iconType] || FaLink;
        return (
          <li key={idx} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-purple-600 group transition-colors">
            <a href={formatUrl(item.url)} target="_blank" rel="noopener noreferrer" aria-label={showingTranslateValue(item.label) || item.iconType} className="flex items-center justify-center w-full h-full">
              <Icon className="text-gray-600 group-hover:text-white w-4 h-4" />
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default SocialLinks; 