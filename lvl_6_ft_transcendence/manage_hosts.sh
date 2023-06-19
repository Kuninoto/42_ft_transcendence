#!/bin/sh

# if delete option is passed, erase all ft_transcendence
# entries from hosts
if [[ $1 == "-d" ]] || [[ $1 == "--delete" ]]; then
    sed -i '/ft_transcendence/d' /etc/hosts
    exit 0
fi

NGINX_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' nginx)

# Removing previous entries
sed -i "/ft_transcendence/d" /etc/hosts

# Write the new entries to /etc/hosts
sed -i "1i'$NGINX_IP' ft_transcendence" /etc/hosts
sed -i "1i'$NGINX_IP' ft_transcendence.com" /etc/hosts
sed -i "1i'$NGINX_IP' www.ft_transcendence.com" /etc/hosts

cat /etc/hosts
