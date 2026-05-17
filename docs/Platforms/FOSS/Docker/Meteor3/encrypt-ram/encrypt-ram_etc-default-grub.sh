# /etc/default/grub at Hetzner Ubuntu 26.04: mem_encrypt=on for
# RAM Memory Encryption. Also using XFS for MongoDB with RAID.
# ----
# If you change this file or any /etc/default/grub.d/*.cfg file,
# run 'update-grub' afterwards to update /boot/grub/grub.cfg.
# For full documentation of the options in these files, see:
#   info -f grub -n 'Simple configuration'

GRUB_DEFAULT=0
GRUB_TIMEOUT=5
GRUB_DISTRIBUTOR=`( . /etc/os-release && echo ${NAME} )`
GRUB_CMDLINE_LINUX_DEFAULT="consoleblank=0 mem_encrypt=on"
GRUB_CMDLINE_LINUX="consoleblank=0 systemd.show_status=true"
