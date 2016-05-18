const Promise = new require('bluebird'),
    _ = require('lodash'),
    YAML = require('yamljs'),
    exec = Promise.promisify(require('child_process').exec),
    readFile = Promise.promisify(require('fs').readFile),
    writeFile= Promise.promisify(require('fs').writeFile)
    ;


module.exports.update = (file,tld) => {
    var result = YAML.load(file);
    var services = _(result.services)
        .map((val,key) => key)
        .value();
    Promise
        .map(services,(service) => {
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
            return readFile('/etc/hosts','utf8')
                .then((result) => {
                    _.each(servicesIps, (service) => {
                        const re = new RegExp(`.*${service.name}\.${tld}.*`,'gi');
                        result = result.replace(re,'')
                    });

                    _.each(servicesIps, (service) => {
                        result += `${service.ip} ${service.name}.${tld} \n`;
                        result += `${service.ip} www.${service.name}.${tld} \n`;
                    });
                    _.each(servicesIps,(service)=>{
                        console.log(`Service: ${service.name} running on: ${service.name}.${tld} or www.${service.name}.${tld}`)
                    });
                    return writeFile('/etc/hosts',result);

                }).then(()=>{
                    console.log("Successfully Updated Hosts");
                }).catch(()=>{
                    console.log("An error as occurred!!!!!!!!!!!!!!!!");
                });
        })


};