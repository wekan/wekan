
# Recursive find/replace.
# Syntax: ./find-replace.sh searchtext replacetext

egrep -lRZ '$1' . | xargs -0 -l sed -i -e 's/$1/$2/g'
