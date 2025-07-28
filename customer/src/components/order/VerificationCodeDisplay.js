import React from 'react';
import { FiShield, FiCopy, FiCheck } from 'react-icons/fi';
import useTranslation from 'next-translate/useTranslation';

const VerificationCodeDisplay = ({ verificationCode, orderInvoice, onCopy }) => {
  const { lang } = useTranslation();
  const tr = (en, ar) => (lang === 'ar' ? ar : en);

  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(verificationCode);
    setCopied(true);
    onCopy && onCopy();
    
    // Reset copied state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  if (!verificationCode) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <FiShield className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🔐 {tr('Your Order Verification Code', 'رمز التحقق لطلبك')}
          </h3>
          
          <p className="text-sm text-blue-700 mb-4">
            {tr('Please save this verification code. You\'ll need to provide it to the delivery person when receiving your order', 'يرجى حفظ رمز التحقق هذا. ستحتاج إلى تقديمه إلى مندوب التوصيل عند استلام طلبك')} #{orderInvoice}.
          </p>
          
          <div className="bg-white border-2 border-blue-300 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">{tr('Verification Code:', 'رمز التحقق:')}</p>
                <p className="text-2xl font-mono font-bold text-blue-900 tracking-wider">
                  {verificationCode}
                </p>
              </div>
              
              <button
                onClick={handleCopyCode}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {copied ? (
                  <>
                    <FiCheck className="w-4 h-4" />
                    <span className="text-sm">{tr('Copied!', 'تم النسخ!')}</span>
                  </>
                ) : (
                  <>
                    <FiCopy className="w-4 h-4" />
                    <span className="text-sm">{tr('Copy', 'نسخ')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-yellow-800 mb-1">
              📝 {tr('Important Instructions:', 'ملاحظات هامة:')}
            </h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• {tr('Keep this code safe until your order is delivered', 'احتفظ بهذا الرمز بأمان حتى يتم تسليم طلبك')}</li>
              <li>• {tr('The delivery person will ask for this code before completing delivery', 'سيطلب منك مندوب التوصيل هذا الرمز قبل إتمام التسليم')}</li>
              <li>• {tr('Do not share this code with anyone except the delivery person', 'لا تشارك هذا الرمز مع أي شخص باستثناء مندوب التوصيل')}</li>
              <li>• {tr('This code can only be used once for this order', 'يمكن استخدام هذا الرمز مرة واحدة فقط لهذا الطلب')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationCodeDisplay; 