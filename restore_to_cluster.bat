@echo off
echo Restoring MongoDB dump to cluster...
"C:\Program Files\MongoDB\Tools\100\bin\mongorestore.exe" --uri "mongodb+srv://asadji10001:a3BTsHNptI7dhk9G@saptmarkets.ipkaggw.mongodb.net/?retryWrites=true&w=majority&appName=saptmarkets" --db saptmarkets --dir mongodb_dump/saptmarkets
echo Restore completed!
pause 