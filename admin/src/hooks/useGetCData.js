import { AdminContext } from "@/context/AdminContext";
import { useLocation } from "react-router-dom";
import { useContext, useEffect, useState } from "react";

const useGetCData = () => {
  const { state } = useContext(AdminContext);
  const { adminInfo } = state;

  const location = useLocation();
  const path = location?.pathname?.split("?")[0].split("/")[1];
  const fullPath = location?.pathname?.split("?")[0].substring(1); // Remove leading slash

  const [role, setRole] = useState();
  const [accessList, setAccessList] = useState([]);

  // Function to decrypt data
  const decryptData = (encryptedData, ivHex) => {
    try {
      // Convert hex to bytes
      const encryptedBytes = new Uint8Array(
      encryptedData.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
    );
      const ivBytes = new Uint8Array(
        ivHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
    );

      // Convert to base64 for display
      const encryptedBase64 = btoa(String.fromCharCode.apply(null, encryptedBytes));
      const ivBase64 = btoa(String.fromCharCode.apply(null, ivBytes));

      // Make API call to decrypt
      return fetch('/api/admin/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminInfo.token}`,
        },
        body: JSON.stringify({
          encryptedData: encryptedBase64,
          iv: ivBase64
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.decryptedData) {
          return JSON.parse(data.decryptedData);
        }
        throw new Error('Decryption failed');
      });
    } catch (error) {
      console.error("Decryption failed:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchDecryptedData = async () => {
      if (adminInfo?.data && adminInfo?.iv && adminInfo?.token) {
        try {
          console.log("Attempting to decrypt admin data...");
          const decryptedArray = await decryptData(adminInfo.data, adminInfo.iv);
          
          if (decryptedArray && Array.isArray(decryptedArray)) {
            const lastElement = decryptedArray.pop();
          setRole(lastElement);
          setAccessList(decryptedArray);
            console.log("Decryption successful:", { role: lastElement, accessList: decryptedArray });
          } else {
            console.error("Decryption returned invalid data:", decryptedArray);
            // Fallback: Use role from adminInfo directly for Super Admin
            if (adminInfo.email === 'admin@gmail.com' || adminInfo.role === 'Super Admin') {
              console.log("Applying Super Admin fallback access");
              setRole("Super Admin");
              setAccessList([
                "dashboard", "products", "categories", "attributes", "units",
                "promotions", "banners", "coupons", "orders", "our-staff",
                "settings", "languages", "currencies", "store", "customers",
                "odoo-sync", "odoo-catalog", "reports", "reports/sales", "reports/inventory",
                "reports/customers", "reports/delivery", "reports/financial", "reports/executive",
                "delivery/dashboard", "delivery/assignments", "delivery/drivers", "delivery/tracking",
                "delivery/settings", "products/import-export", "categories/import-export"
              ]);
            }
          }
        } catch (error) {
          console.error("Failed to decrypt and parse data:", error);
          console.error("Admin info:", { 
            hasData: !!adminInfo.data, 
            hasIv: !!adminInfo.iv, 
            hasToken: !!adminInfo.token,
            email: adminInfo.email 
          });
          
          // Fallback for Super Admin if decryption fails
          if (adminInfo.email === 'admin@gmail.com' || adminInfo.role === 'Super Admin') {
            console.log("Decryption failed, applying Super Admin fallback");
            setRole("Super Admin");
            setAccessList([
              "dashboard", "products", "categories", "attributes", "units",
              "promotions", "banners", "coupons", "orders", "our-staff", 
              "settings", "languages", "currencies", "store", "customers",
              "odoo-sync", "odoo-catalog", "reports", "reports/sales", "reports/inventory",
              "reports/customers", "reports/delivery", "reports/financial", "reports/executive",
              "delivery/dashboard", "delivery/assignments", "delivery/drivers", "delivery/tracking",
              "delivery/settings", "products/import-export", "categories/import-export"
            ]);
          }
        }
      } else {
        console.log("Missing required admin info for decryption:", {
          hasData: !!adminInfo?.data,
          hasIv: !!adminInfo?.iv,
          hasToken: !!adminInfo?.token,
          email: adminInfo?.email
        });
      }
    };

    fetchDecryptedData();
  }, [adminInfo]);

  return {
    role,
    path,
    fullPath,
    accessList,
  };
};

export default useGetCData;
