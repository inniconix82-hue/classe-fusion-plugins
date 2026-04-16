; Custom NSIS hook - installe Ollama automatiquement
!macro customInstall
  DetailPrint "Vérification d'Ollama..."

  ; Check if Ollama is already installed
  ReadRegStr $0 HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Ollama" "DisplayName"
  ${If} $0 != ""
    DetailPrint "Ollama est déjà installé."
  ${Else}
    DetailPrint "Téléchargement d'Ollama en cours..."
    SetDetailsPrint both
    nsExec::ExecToLog 'powershell.exe -NonInteractive -Command "& { $ProgressPreference = ''SilentlyContinue''; Invoke-WebRequest -Uri ''https://ollama.com/download/OllamaSetup.exe'' -OutFile ''$env:TEMP\OllamaSetup.exe'' }"'
    Pop $0
    ${If} $0 == 0
      DetailPrint "Installation d'Ollama..."
      ExecWait '"$TEMP\OllamaSetup.exe" /SILENT' $1
      Delete "$TEMP\OllamaSetup.exe"
      DetailPrint "Ollama installé avec succès."
    ${Else}
      DetailPrint "Impossible de télécharger Ollama. Installez-le manuellement depuis https://ollama.com"
    ${EndIf}
  ${EndIf}
!macroend

!macro customUnInstall
  ; Rien à faire lors de la désinstallation
!macroend
