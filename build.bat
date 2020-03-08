@ECHO OFF

ECHO - Deleting old executable...
2>NUL rm ./snd.exe

ECHO - Building with '%*' tags...
cd ./cmd/
go build -o ../snd.exe -tags="%*"
cd ../

ECHO - snd.exe created!