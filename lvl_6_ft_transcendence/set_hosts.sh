#!/bin/sh

NGINX_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' nginx)

# Removing previous entries
sed -i '/.com/d' /etc/hosts

# Write the new entries to /etc/hosts
sed -i '1i'$NGINX_IP' ft_transcendence.com' /etc/hosts
sed -i '1i'$NGINX_IP' www.ft_transcendence.com' /etc/hosts

cat /etc/hosts
