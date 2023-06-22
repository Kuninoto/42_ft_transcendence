# sudo useradd --create-home --password plsdonthackme123 nnuno-ca

sudo apt-get update -yq

sudo apt-get install -yq ca-certificates\
                         curl\
                         gnupg

# Add Docker’s official GPG key:
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -yq

# Install Docker, Docker-Compose
sudo apt-get install -yq docker-ce\
                         docker-ce-cli\
                         containerd.io\
                         docker-buildx-plugin\
                         docker-compose-plugin\
                         docker-compose\

# Check if both Docker and Docker-Compose were correctly installed
if [[ -x $(command -v "docker") && -x $(command -v "docker-compose") ]]; then
    echo "Docker and Docker-Compose successfully installed!"
    docker --version
    docker-compose --version
else
    echo "ERROR: Docker or Docker-Compose installation failed!"
fi

# Allow non-root users to run Docker
sudo chmod 666 /var/run/docker.sock

# Create docker group
sudo groupadd docker

# Add current user to the Docker group
sudo usermod -aG docker $USER

# Install npm
sudo apt-get install -yq npm nodejs

# Check if npm is correctly installed
if [[ -x $(command -v "npm") ]]; then
    echo "npm sucessfully installed!"
    npm --version
else
    echo "ERROR: npm installation failed!"
fi

# Update nodejs
sudo npm cache clean -f
sudo npm install -g n
sudo n stable

sudo npm install -g typescript

# Check if typescript is correctly installed
if [[ -x $(command -v "tsc") ]]; then
    echo "tsc sucessfully installed!"
    tsc --version
else
    echo "ERROR: tsc installation failed!"
fi

sudo npm i -g tailwindcss@latest postcss@latest autoprefixer@latest

sudo npm i -g @nestjs/cli
