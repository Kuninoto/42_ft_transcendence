#!/bin/sh

# if delete option is passed, erase all pongfight
# entries from hosts
if [[ $1 == "-d" ]] || [[ $1 == "--delete" ]]; then
    sed -i "/pongfight/d" /etc/hosts
    exit 0
fi

# Removing previous entries
sed -i "/pongfight/d" /etc/hosts

# Write the new entries to /etc/hosts
sed -i "1i'127.0.0.1:3001' pongfight.com" /etc/hosts
sed -i "1i'127.0.0.1:3001' www.pongfight.com" /etc/hosts

cat /etc/hosts
