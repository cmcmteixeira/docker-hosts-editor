const Promise = new require('bluebird'),
    _ = require('lodash'),
    YAML = require('yamljs'),
    exec = Promise.promisify(require('child_process').exec),
    readFile = Promise.promisify(require('fs').readFile),
    writeFile= Promise.promisify(require('fs').writeFile)
    log = require('npmlog');


module.exports.update = (file,tld) => {
    log.verbose(`Reading file: ${file}`);
    var result = YAML.load(file);
    log.verbose(`File:' + ${file} , read with success`);
    var services = _(result.services)
        .map((val,key) => key)
        .value();
    log.verbose(`Services defined in:' + ${file} : ${_.join(services,',')}`);
    Promise
        .map(services,(service) => {
            log.verbose(`Inspecting: ${service}`);
            return exec(`docker inspect $(docker-compose ps -q ${service})`)
        })
        .then((result)=>{
            const servicesIps = _(result)
                .map((val) => JSON.parse(val))
                .map((val) => _.first(val))
                .map((val) => val.NetworkSettings.Networks)
                .map((val) => {
                    return val[_.first(_.keys(val))].IPAddress
                })
                .zipWith(services,(ip,service) => {
                    return {ip,name:service}
                })
                .remove((service) => service.ip)
                .value();
            log.verbose(`Reading Hosts`);
            return readFile('/etc/hosts','utf8')
                .then((result) => {
                    log.verbose(`Original Hosts File:' + ${result}`);

                    _.each(servicesIps, (service) => {
                        const re = new RegExp(`.*${service.name}\.${tld}.*`,'gi');
                        result = result.replace(re,'')
                    });
                    log.verbose(`File w/ old hosts removed:' + ${result}`);
                    _.each(servicesIps, (service) => {
                        result += `${service.ip} ${service.name}.${tld} \n`;
                        result += `${service.ip} www.${service.name}.${tld} \n`;
                    });
                    log.verbose(`Final File:' + ${result}`);
                    _.each(servicesIps,(service)=>{
                        log.info(`Service: ${service.name} running on: ${service.name}.${tld} or www.${service.name}.${tld}`);
                    });
                    return writeFile('/etc/hosts',result);

                }).then(()=>{
                    log.info("Successfully Updated Hosts");
                }).catch((error)=>{
                    log.error("An error as occurred!!!!!!!!!!!!!!!!");
                    log.error(error);
                });
        })


};