#!/bin/sh

# if delete option is passed, erase all ft_transcendence
# entries from hosts
if [[ $1 == "-d" ]] || [[ $1 == "--delete" ]]; then
    sed -i "/pongfight/d" /etc/hosts
    exit 0
fi

NEST_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' nest)

# Removing previous entries
sed -i "/pongfight/d" /etc/hosts

# Write the new entries to /etc/hosts
sed -i "1i'$NGINX_IP' pongfight" /etc/hosts
sed -i "1i'$NGINX_IP' pongfight.com" /etc/hosts
sed -i "1i'$NGINX_IP' www.pongfight.com" /etc/hosts

cat /etc/hosts
