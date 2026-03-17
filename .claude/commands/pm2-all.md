Start all services and open PM2 monitor.
```bash
cd "C:/Users/Naveen/OneDrive/Desktop/orgblueprint-clean" && pm2 start ecosystem.config.cjs && start wt.exe -d "C:/Users/Naveen/OneDrive/Desktop/orgblueprint-clean" pwsh -NoExit -c "pm2 monit"
```
