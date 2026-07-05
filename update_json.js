const fs = require('fs');
let data = JSON.parse(fs.readFileSync('vehiculo.json', 'utf8'));

['vehiculos', 'motos'].forEach(key => {
    if(data[key]){
        data[key].forEach((v, idx) => {
            v.precio_alquiler_dia = Math.round(v.precio_venta * 0.005);
            v.precio_alquiler_hora = Math.round(v.precio_alquiler_dia / 8);
            if (idx % 3 === 0) {
                v.oferta_alquiler = "20% desc. finde";
            } else {
                v.oferta_alquiler = "";
            }
        });
    }
});

fs.writeFileSync('vehiculo.json', JSON.stringify(data, null, 4));
