clear
sudo apt update 
supdo apt install docker.io
sudo apt install docker.io
sudo apt docker-compose
sudo apt install docker-compose
sudo usermod -aG docker ubuntu
docker --version
docker-compose --version
sudo apt install docker-compose -y
docker-compose-v2 --version
docker compose version
mkdir ai-lead && cd ai-lead
nano docker-compose.yml
docker-compose up -d
docker compose up -d
nano docker-compose.yml
docker compose -d
docker compose up -d
sudo docker compose up -d
exit
cd ai-lead
docker compose up
docker compose up -d
sudo -u postgres psql
docker ps
docker exec -it ai_lead_db psql -U postgres
docker exec -it ai_lead_db psql -U $(docker exec ai_lead_db bash -c 'echo $POSTGRES_USER')
docker stop ai_lead_db && docker rm ai_lead_db
docker compose version
nano docker-compose.yml
docker compose up -d
docker ps
docker exec -it bdh_postgres psql -U bdh_user -d business_data_hub
docker exec -it bdh_postgres psql -U bdh_user -d business_data_hub
echo "ServerAliveInterval 60" >> ~/.ssh/config
docker exec -it bdh_postgres psql -U bdh_user -d business_data_hub
lsb_release -a
docker ps
docker exec -it bdh_postgres psql -U bdh_user -d business_data_hub -c "SELECT version();"
cat ~/business_data_hub/docker-compose.yml
find / -name "docker-compose.yml" 2>/dev/null
cat /home/ubuntu/docker-compose.yml
cat /home/ubuntu/ai-lead/docker-compose.yml
docker ps -a
rm -rf /home/ubuntu/ai-lead
docker ps
docker-compose up -d
docker compose up -d
npm run dev
docker ps
docker compose down -d
docker compose down
docker compose up -d
nano docker-compose.yml
docker exec -it bdh_postgres psql -U bdh_user -d business_data_hub
git --version
git config --global user.name "Jyotirmoy"
git config --global user.email "borahjyotirmoy030@gmail.com"
cd ~
git init
git branch -m main
nano .gitignore
nano .env
nano docker-compose.yml
cat docker-compose.yml
nano docker-compose.yml
cat docker-compose.yml
git remote add origin https://github.com/Rvk30/ai-lead.git
git add docker-compose.yml .gitignore
git commit -m "Initial setup: Docker Compose with PostgreSQL and Redis"
git push -u origin main
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQD0hiWS7Wv99ScBuIv8yYGDN8c9ceONmv3RtrgqyrMQegfro3zlVyfLd+SwloWbQEBTVAxecnsaTVDgQ2n3B5EqbGkFSLf49lO3sAtmtbn6L5bri1MYZkCSYlU46dLvk/JHaZSXQuTsari8aTEm21AtBIKnVvSFytcgNCGPrT/bB3RAxyTl0ErZUKGJkJL3Fy406+HzPvYdE2FAhr/5/bA88PHNKw1pOT0KVtzVB46xgXD8FwztjlxBp9hAmG3Tu0NF3Z7HN+x4IEH4iJXbLdLrEPuYIW246wlJZitDlt9NS4jY+GCE7LrjlWhwYv1I98cfzgTHOcnd3ZS6EuwjpLCB7zQuCGJWeEDLEytv2y5RrBSAxPavGh4H5sEl5ZHi8APCNfRfUTz+rxeZBsjeahSgQbucYnFdti42PGbSlbu0IqOg6/PNEqBYh928wpFwDwXXNWUjqsfmD0htX9HS5j6npK9RxtCp65o8sopsg8IKKwAyvLYaGdNhB4bWufK0epdQmbaRB2kcwRQpQAuRoJwCj+yDJ9ZqDcccSWMJa6vObtQvyyrHN3IQT+Bs6l/o2OLr3GcJ/ZcWOXTstBghwx9T0JCxaILBBNmKFbAeGjdZCm6vs5DmK989ECITbI7ENkqAo0BBs3NuuFS78Ktzbefqf3b67befkz46x4bbpEfdpw== umesh@UmeshKaushik" >> ~/.ssh/authorized_keys
exit
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
mkdir -p ~/worker && cd ~/worker 
npn init
npm init -y
npm install bullmq
cd ..
docker ps
\dt lead_intelligence.*
clear
docker ps
docker exec -it bdh_postgres psql -U bdh_user -d business_data_hub -c "\dt lead_intelligence.*"
docker exec -it bdh_postgres psql -U bdh_user -d business_data_hub -c "\dn"
docker exec -it bdh_postgres psql -U bdh_user -d business_data_hub
docker restart bdh_postgres
docker exec -it bdh_postgres psql -U bdh_user -d business_data_hub -c "SELECT * FROM lead_intelligence.users;"
cd ~/worker && ls
nano worker.js
node worker.js
sudo apt-get install awscli -y
aws configure
aws s3 ls
cd ..
docker exec -it bdh_postgres psql -U bdh_user -d business_data_hub
scp -i "/tmp/devops.pem" "/mnt/c/Users/borah/Downloads/sample_leads_100.csv" ubuntu@ec2-3-14-10-147.us-east-2.compute.amazonaws.com:~/
find /mnt/c/Users/borah -name "*.csv" 2>/dev/null
ls /mnt/c/Users/borah/Downloads/ | grep csv
scp -i "/tmp/devops.pem" "/mnt/c/Users/borah/Downloads/sample_leads_100.csv" ubuntu@ec2-3-14-10-147.us-east-2.compute.amazonaws.com:~/
ls ~/ | grep csv
docker cp ~/sample_leads_100.csv bdh_postgres:/tmp/
docker exec -it bdh_postgres psql -U bdh_user -d business_data_hub
scp -i "/tmp/devops.pem" "/mnt/c/Users/borah/Downloads/raw_merged.csv" ubuntu@ec2-3-14-10-147.us-east-2.compute.amazonaws.com:~/
cat /home/ubuntu/pipeline/watcher.js
cat /home/ubuntu/pipeline/ingest.js
cp /home/ubuntu/raw_merged.csv /home/ubuntu/incoming/test_file.csv
nano /home/ubuntu/pipeline/raw_to_staging.js
node /home/ubuntu/pipeline/raw_to_staging.js
docker exec -it bdh_postgres psql -U bdh_user -d business_data_hub -c "\d lead_intelligence.staging_businesses"
docker exec -it bdh_postgres psql -U bdh_user -d business_data_hub -c "
ALTER TABLE lead_intelligence.staging_businesses 
ADD COLUMN google_rating TEXT,
ADD COLUMN location TEXT,
ADD COLUMN source_file TEXT,
ADD COLUMN remarks TEXT;
"
nano /home/ubuntu/pipeline/raw_to_staging.js
docker exec -it bdh_postgres psql -U bdh_user -d business_data_hub -c "TRUNCATE TABLE lead_intelligence.staging_businesses;"
node /home/ubuntu/pipeline/raw_to_staging.js
cp "/tmp/devops.pem" ~/devops.pem && chmod 400 ~/devops.pem
scp -i "~/devops.pem" "/mnt/c/Users/borah/Downloads/raw_merged.csv" ubuntu@ec2-3-14-10-147.us-east-2.compute.amazonaws.com:~/
ssh -i "/tmp/devops.pem" ubuntu@ec2-3-14-10-147.us-east-2.compute.amazonaws.com
ls ~/ | grep csv
rm ~/sample_leads_100.csv
mkdir -p ~/connector && cd connector
npm init -y
npm install csv-parser pg
cd ..
mkdir -p /home/ubuntu/pipeline
mkdir -p /home/ubuntu/incoming
mkdir -p /home/ubuntu/processed
mkdir -p /home/ubuntu/failed
node --version
nano /home/ubuntu/pipeline/package.json
cd /home/ubuntu/pipeline && npm install
nano /home/ubuntu/pipeline/ingest.js
nano /home/ubuntu/pipeline/watcher.js
npm i 
nano /home/ubuntu/pipeline/setup_db.sql
docker exec -it bdh_postgres psql -U bdh_user -d business_data_hub -f /tmp/setup_db.sql
docker cp /home/ubuntu/pipeline/setup_db.sql bdh_postgres:/tmp/
docker exec -it bdh_postgres psql -U bdh_user -d business_data_hub -f /tmp/setup_db.sql
cp /home/ubuntu/raw_merged.csv /home/ubuntu/incoming/
node /home/ubuntu/pipeline/ingest.js /home/ubuntu/incoming/
node /home/ubuntu/pipeline/watcher.js
mkdir -p /opt/backups/postgres
sudo mkdir -p /opt/backups/postgres
sudo mkdir -p /opt/backup && sudo tee /opt/backup/pg_backup.sh << 'EOF'
#!/bin/bash
DB_NAME="business_data_hub"
DB_USER="postgres"
BACKUP_DIR="/opt/backups/postgres"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_$DATE.dump"
mkdir -p "$BACKUP_DIR"
pg_dump -U "$DB_USER" -Fc "$DB_NAME" -f "$BACKUP_FILE"
find "$BACKUP_DIR" -name "*.dump" -mtime +7 -delete
echo "Backup complete: $BACKUP_FILE"
EOF

sudo nano /opt/backup/pg_backup.sh
sudo chmod +x /opt/backup/pg_backup.sh
sudo /opt/backup/pg_backup.sh
chmod +x /opt/backup/pg_backup.sh
/opt/backup/pg_backup.sh
sudo chown -R ubuntu:ubuntu /opt/backups
sudo chown -R ubuntu:ubuntu /opt/backup
/opt/backup/pg_backup.sh
aws s3 ls s3://bdh-backups-jyotirmoy/
crontab -e
crontab -l
git add .
git commit -m"Added pipeline scripts, backup setup and worker"
git push 
cd..
cd ..
exit
nano /home/ubuntu/pipeline/ingest.js
exit
cp /mnt/c/Users/borah/downloads/devops.pem ~/devops.pem
chmod 400 ~/devops.pem
ssh -i "~/devops.pem" ubuntu@ec2-3-14-10-147.us-east-2.compute.amazonaws.com
docker exec -it bdh_postgres psql -U bdh_user -d business_data_hub -c "TRUNCATE TABLE lead_intelligence.raw_records CASCADE;"
scp -i "/tmp/devops.pem" "/mnt/c/Users/borah/Downloads/raw_merged.csv" ubuntu@ec2-3-14-10-147.us-east-2.compute.amazonaws.com:~/incoming/
node /home/ubuntu/pipeline/ingest.js /home/ubuntu/incoming/
nano /home/ubuntu/pipeline/ingest.js
docker exec -it bdh_postgres psql -U bdh_user -d business_data_hub -c "TRUNCATE TABLE lead_intelligence.raw_records CASCADE;"
node /home/ubuntu/pipeline/ingest.js /home/ubuntu/incoming/
docker ps
cat /var/log/pg_backup.log
/opt/backup/pg_backup.sh
sudo touch /var/log/pg_backup.log
sudo chmod 666 /var/log/pg_backup.log
/opt/backup/pg_backup.sh
cat /var/log/pg_backup.log
crontab -l
