Write-Host "Restoring MongoDB dump to cluster..." -ForegroundColor Green

$mongorestorePath = "C:\Program Files\MongoDB\Tools\100\bin\mongorestore.exe"
$connectionString = "mongodb+srv://asadji10001:a3BTsHNptI7dhk9G@saptmarkets.ipkaggw.mongodb.net/?retryWrites=true&w=majority&appName=saptmarkets"
$dumpDir = "mongodb_dump\saptmarkets"

& $mongorestorePath --uri $connectionString --db saptmarkets --dir $dumpDir

Write-Host "Restore completed!" -ForegroundColor Green
Read-Host "Press Enter to continue" 