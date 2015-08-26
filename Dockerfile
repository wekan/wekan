FROM centos:centos7

RUN yum -y install tar
RUN curl https://install.meteor.com/ | sh

RUN yum -y install git
RUN cd /opt; git clone https://github.com/libreboard/libreboard.git
RUN cd /opt/libreboard; meteor update
RUN alias ll="ls -l"

WORKDIR /opt/libreboard
CMD meteor

# to run with mongo DB on the host machine and allow direct access to host network
# docker run -d --name="libreboard" --net host -e "MONGO_URL=mongodb://127.0.0.1" -e "ROOT_URL=http://libreboard.localdomain" libreboard
# starts libreboard on port 3000 on the host
