From [ksaadDE](https://github.com/ksaadDE) at https://github.com/wekan/wekan-snap/issues/167

Hi,

I've read that in e.g. https://github.com/wekan/wekan-snap/issues/118  there is assumed that local https wouldn't work (even not for ips). I provide a small guide to fix this.

*Despite the fact that you should **never use self-signed certs in production**. You mess up your TLS Certificate Verification/Validation and therefore exposing yourself to various risks in cyberspace. **For limited local uses it can be valid!***

# General Config
In both cases your `/etc/hosts` should have *a* entry that routes your "domain" `wekan.local` to `127.0.0.1` (=localhost)   like this:
```
127.0.0.1 wekan.local
```
You need to enable caddy `sudo snap set wekan caddy-enabled='true'` and set the `root-url` to https://wekan.local. 
Keep in mind that 3001 is the wekan webapp port, not the caddy port(!). Caddy will use 80 and 443.
 
# Option 1: `tls self_signed` 7d Dev Certificate (Caddy<v2) 
Your `/var/snap/wekan/common/Caddyfile` should look like this:
```
https://wekan.local {
        tls self_signed
        proxy / localhost:3001 {
          websocket
          transparent
        }
}
```

Restart your Wekan snap service: `sudo snap restart wekan && sudo snap restart wekan.caddy` voila! 

*Drawback:* There is a significant drawback in doing so, because the public docs of caddy stating that below caddyV2 (like in our snap) there's only a seven day life span given. Due to the origin intent of testing, not for production.

# Option 2: Custom, long-living, self-signed TLS Cert
Your `/var/snap/wekan/common/Caddyfile` should look like this:
```
https://wekan.local {
        tls /var/snap/wekan/common/certs/certificate.pem /var/snap/wekan/common/certs/key.pem
        proxy / localhost:3001 {
          websocket
          transparent
        }
}
```

Create a bash script using  `sudo nano /var/snap/wekan/common/certs/certgen.sh` :
```
#!/bin/bash
# this script checks existence of CERTFILE and KEYFILE in current directory and moves existing files to FILE.old then generating new TLS certs (self-signed) with a CN of $SERVERNAME,  finally it restarts the snap wekan service + caddy

ROOTPATH="/var/snap/wekan/common/certs"

SERVERNAME="wekan.local"

CERTFILE="$ROOTPATH/certificate.pem"
KEYFILE="$ROOTPATH/key.pem"


if [ -f "$CERTFILE" ]; then
        echo "[+] backing up '$CERTNAME'";
        sudo mv "$CERTFILE" "$CERTNAME.old";
fi

if [ -f "$KEYFILE" ]; then
        echo "[+] backing up '$KEYFILE'";
        sudo mv "$KEYFILE" "$KEYFILE.old";
fi

echo "[+] Trying to generate certs";

sudo openssl req -newkey rsa:4096 \
            -x509 \
            -sha256 \
            -days 3650 \
            -nodes \
            -out "$CERTFILE" \
            -keyout "$KEYFILE" \
            -subj "/C=SI/ST=Ljubljana/L=Ljubljana/O=Security/OU=IT Department/CN=$SERVERNAME" &>/dev/null

if [ ! -f "$CERTFILE" ]; then
        echo "[-] can't fiund '$CERTFILE' seemingly the generation failed";
        exit
fi

if [ ! -f "$KEYFILE" ]; then
        echo "[-] can't find '$KEYFILE' seemingly the generation failed";
        exit
fi

echo "[+] completed TLS-Cert generation";

# restart snap wekan && wekan.caddy
echo "[+] restarting snap wekan service";
sudo snap restart wekan &>/dev/null
sudo snap restart wekan.caddy &>/dev/null
echo "[+] completed restart snap wekan service";
echo " ";
echo "[i] please check https://$SERVERNAME/"
```
This file generates two files `certificate.pem` and `key.pem`, then checks their existence in  `/var/snap/wekan/common/certs/` (same dir). If the CERTFILE or KEYFILE already existing, it will move the existing files to <fname>.old.  Then it restarts the wekan services wekan and caddy. Afterwards it shows you the address to visit. 

Make the sh file executable `sudo chmod u+x ./runfiles.sh`

Finally, run `sudo ./runfiles.sh` and it should work at the address being recommended to visit. 


### Things to keep note of
- Don't try to use `load` it won't work!
- Don't mess around without a SERVERNAME... it won't work
- Don't use the default caddy file with this tls subdirectives. It won't work and break into No Connection or `PR_END_OF_FILE_ERROR` (firefox)
- Caddy has bugs with self_signed certificates for Caddy < 2 (below caddyv2)
- **FIREWALL CONFIG:** Don't forget to block in and out 3001 for outside connections (e.g. using ufw or nfttables / iptables)

### Sources:
- https://linuxize.com/post/creating-a-self-signed-ssl-certificate/ (openssl cmd)
- https://caddy.community/t/proper-way-to-utilize-self-signed-certificates/7264 (reading docs and issues of caddy)
- https://caddy.community/t/tls-self-signed-not-working/5057
- - https://github.com/wekan/wekan/wiki/Caddy-Webserver-Config (Wekan Docs)
- https://github.com/wekan/wekan-snap/issues/118 
- Snap Wekan Docs

Greetings from Germany <3