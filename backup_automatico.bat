@echo off
REM Script de Backup Automático - Sistema de Gestão TI
REM Execute este script para fazer backup do banco de dados

setlocal enabledelayedexpansion

REM Configurações
set PGUSER=postgres
set PGDATABASE=gestao_ti
set BACKUP_DIR=C:\Backups\GestaoTI

REM Criar diretório de backup se não existir
if not exist %BACKUP_DIR% (
    mkdir %BACKUP_DIR%
    echo Diretório de backup criado: %BACKUP_DIR%
)

REM Gerar nome do arquivo com data e hora
set DATA=%date:~6,4%%date:~3,2%%date:~0,2%
set HORA=%time:~0,2%%time:~3,2%
set HORA=!HORA: =0!
set BACKUP_FILE=%BACKUP_DIR%\backup_gestao_ti_%DATA%_%HORA%.dump

REM Solicitar senha
echo ============================================
echo  BACKUP DO SISTEMA DE GESTAO TI
echo ============================================
echo.
echo Criando backup de: %PGDATABASE%
echo Destino: %BACKUP_FILE%
echo.

REM Fazer backup
pg_dump -U %PGUSER% -d %PGDATABASE% -F c -f "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo  BACKUP CRIADO COM SUCESSO!
    echo ============================================
    echo.
    echo Arquivo: %BACKUP_FILE%
    echo Tamanho: 
    dir "%BACKUP_FILE%" | find "backup_gestao_ti"
    echo.
    
    REM Limpar backups antigos (manter últimos 7 dias)
    echo Removendo backups com mais de 7 dias...
    forfiles /p %BACKUP_DIR% /m *.dump /d -7 /c "cmd /c del @path" 2>nul
    
    echo.
    echo DICA: Guarde este backup em local seguro!
) else (
    echo.
    echo ============================================
    echo  ERRO AO CRIAR BACKUP!
    echo ============================================
    echo.
    echo Verifique se:
    echo 1. PostgreSQL está rodando
    echo 2. A senha está correta
    echo 3. O banco 'gestao_ti' existe
)

echo.
pause
