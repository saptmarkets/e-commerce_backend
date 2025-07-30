@echo off
echo Importing MongoDB dump to cluster...

REM Set the MongoDB connection string
set MONGODB_URI=mongodb+srv://asadji10001:a3BTsHNptI7dhk9G@saptmarkets.ipkaggw.mongodb.net/?retryWrites=true&w=majority&appName=saptmarkets

REM Navigate to the dump directory
cd mongodb_dump\saptmarkets

REM Import all collections
echo Importing all collections...
mongorestore --uri="%MONGODB_URI%" --db=saptmarkets .

echo Import completed!
pause 