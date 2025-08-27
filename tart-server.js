warning: in the working copy of 'routes/productUnitRoutes.js', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'start-server.js', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/start-server.js b/start-server.js[m
[1mindex 424916a..0683658 100644[m
[1m--- a/start-server.js[m
[1m+++ b/start-server.js[m
[36m@@ -148,7 +148,7 @@[m [mapp.use("/api/product-units", productUnitRoutes);[m
 app.use("/api/category", categoryRoutes);[m
 app.use("/api/coupon", couponRoutes);[m
 app.use("/api/customer", customerRoutes);[m
[31m-app.use("/api/order", isAuth, customerOrderRoutes);[m
[32m+[m[32mapp.use("/api/customer-order", isAuth, customerOrderRoutes);[m
 app.use("/api/attributes", attributeRoutes);[m
 app.use("/api/setting", settingRoutes);[m
 app.use("/api/currency", isAuth, currencyRoutes);[m
