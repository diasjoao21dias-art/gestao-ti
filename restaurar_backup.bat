@echo off
REM Script para Restaurar Backup - Sistema de Gestão TI

setlocal enabledelayedexpansion

REM Configurações
set PGUSER=postgres
set PGDATABASE=gestao_ti
set BACKUP_DIR=C:\Backups\GestaoTI

echo ============================================
echo  RESTAURAR BACKUP - SISTEMA DE GESTAO TI
echo ============================================
echo.

REM Verificar se diretório de backup existe
if not exist %BACKUP_DIR% (
    echo ERRO: Diretório de backup não encontrado: %BACKUP_DIR%
    echo.
    pause
    exit /b 1
)

REM Listar backups disponíveis
echo Backups disponíveis:
echo.
dir /b /o-d %BACKUP_DIR%\*.dump
echo.

REM Solicitar arquivo de backup
set /p BACKUP_FILE="Digite o nome do arquivo de backup (ou caminho completo): "

REM Verificar se arquivo existe
if not exist "%BACKUP_FILE%" (
    set BACKUP_FILE=%BACKUP_DIR%\%BACKUP_FILE%
)

if not exist "%BACKUP_FILE%" (
    echo ERRO: Arquivo não encontrado: %BACKUP_FILE%
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo  ATENÇÃO: OPERAÇÃO DESTRUTIVA!
echo ============================================
echo.
echo Esta operação irá:
echo 1. Desconectar todos os usuários do banco
echo 2. APAGAR o banco atual
echo 3. Restaurar o backup: %BACKUP_FILE%
echo.
set /p CONFIRMA="Tem certeza? (S/N): "

if /i not "%CONFIRMA%"=="S" (
    echo.
    echo Operação cancelada pelo usuário.
    pause
    exit /b 0
)

echo.
echo Desconectando usuários...
psql -U %PGUSER% -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '%PGDATABASE%';" 2>nul

echo Restaurando backup...
pg_restore -U %PGUSER% -d %PGDATABASE% -c "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo  BACKUP RESTAURADO COM SUCESSO!
    echo ============================================
    echo.
    echo O banco de dados foi restaurado para o estado do backup.
    echo Você pode iniciar o sistema normalmente.
) else (
    echo.
    echo ============================================
    echo  ERRO AO RESTAURAR BACKUP!
    echo ============================================
    echo.
    echo Tente restaurar manualmente:
    echo pg_restore -U postgres -d gestao_ti -c "%BACKUP_FILE%"
)

echo.
pause
