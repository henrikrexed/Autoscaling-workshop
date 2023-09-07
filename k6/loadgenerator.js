import http from 'k6/http';
import { Httpx } from 'https://jslib.k6.io/httpx/0.0.4/index.js';
//import tracing, { Http } from 'k6/x/tracing';
import { sleep,check} from 'k6';
import { Counter } from "k6/metrics";

/**
 * Hipster workload generator by k6
 * @param __ENV.FRONTEND_ADDR, __ENV.OTLP_SERVICE_ADDR, __ENV.OTLP_SERVICE_PORT
 * @constructor hrexed
 */

let errors = new Counter("errors");

export let options = {
    discardResponseBodies: true,

      stages: [
        { target: 100, duration: '10m' },
        { target: 200, duration: '10m' },
        { target: 250, duration: '10m' },
        { target: 350, duration: '10m' },
      ],

};

const baseurl = `http://${__ENV.FRONTEND_ADDR}`;




const tasks = {
    "index": 1,
    "setCurrency": 2,
    "browseProduct": 10,
    "addToCart": 2,
    "viewCart": 3,
    "checkout": 1
};

const products = [
    '0PUK6V6EV0',
    '1YMWWN1N4O',
    '2ZYFJ3GM2N',
    '66VCHSJNUP',
    '6E92ZMYYFZ',
    '9SIQT8TOJO',
    'L9ECAV7KIM',
    'LS4PSXUNUM',
    'OLJCESPC7Z'];

const waittime = [1,2,3,4,5,6,7,8,9,10]



/*export function setup() {
  console.log(`Running xk6-distributed-tracing v${tracing.version}`);
}*/
export default function() {

    const session = new Httpx({
      baseURL: baseurl,
      timeout: 20000, // 20s timeout.
    });

   /* const http = new Http({
        exporter: "otlp",
        propagator: "w3c",
        endpoint: url
      });*/

    //Access index page
    for ( let i=0; i<tasks["index"]; i++)
    {
        let res = session.get(`/`);
        let checkRes = check(res, { "status is 200": (r) => r.status === 200 });

        // show the error per second in grafana
        if (checkRes === false ){
            errors.add(1);
        }
        sleep(waittime[Math.floor(Math.random() * waittime.length)])
    }

    //Access setCurrency page
    for ( let i=0; i<tasks["setCurrency"]; i++)
    {
        const currencies = ['EUR', 'USD', 'JPY', 'CAD'];
        let res = session.post(`/setCurrency`, {
            'currency_code': currencies[Math.floor(Math.random() * currencies.length)]
        });
        let checkRes = check(res, { "status is 200": (r) => r.status === 200 });

        // show the error per second in grafana
        if (checkRes === false ){
            errors.add(1);
        }
        sleep(waittime[Math.floor(Math.random() * waittime.length)])
    }

    //Access browseProduct page
    for ( let i=0; i<tasks["browseProduct"]; i++)
    {
        let product = products[Math.floor(Math.random() * products.length)]
        let res = session.get(`/product/${product}`);
        let checkRes = check(res, { "status is 200": (r) => r.status === 200 });

        // show the error per second in grafana
        if (checkRes === false ){
            errors.add(1);
        }
        sleep(waittime[Math.floor(Math.random() * waittime.length)])
    }

    //Access addToCart page
    for ( let i=0; i<tasks["addToCart"]; i++)
    {
        let product = products[Math.floor(Math.random() * products.length)]
        let res = session.get(`/product/${product}`);
        let checkRes = check(res, { "status is 200": (r) => r.status === 200 });

        // show the error per second in grafana
        if (checkRes === false ){
            errors.add(1);
        }
        sleep(waittime[Math.floor(Math.random() * waittime.length)])

        const quantity = [1,2,3,4,5,10]

        res = session.post(`/cart`, {
            'product_id': product,
            'quantity': quantity[Math.floor(Math.random() * quantity.length)]
        });
        checkRes = check(res, { "status is 200": (r) => r.status === 200 });

        // show the error per second in grafana
        if (checkRes === false ){
            errors.add(1);
        }
        sleep(waittime[Math.floor(Math.random() * waittime.length)])

    }

    // Access viewCart page
    for ( let i=0; i<tasks["viewCart"]; i++)
    {
        let res = session.get(`/cart`);
        let checkRes = check(res, { "status is 200": (r) => r.status === 200 });

        // show the error per second in grafana
        if (checkRes === false ){
            errors.add(1);
        }
        sleep(waittime[Math.floor(Math.random() * waittime.length)])
    }

    //Access checkout page
    for ( let i=0; i<tasks["checkout"]; i++)
    {
        let res = session.post(`/cart/checkout`, {
            'email': 'someone@example.com',
            'street_address': '1600 Amphitheatre Parkway',
            'zip_code': '94043',
            'city': 'Mountain View',
            'state': 'CA',
            'country': 'United States',
            'credit_card_number': '4432-8015-6152-0454',
            'credit_card_expiration_month': '1',
            'credit_card_expiration_year': '2039',
            'credit_card_cvv': '672',
        });
        let checkRes = check(res, { "status is 200": (r) => r.status === 200 });

        // show the error per second in grafana
        if (checkRes === false ){
            errors.add(1);
        }
        sleep(waittime[Math.floor(Math.random() * waittime.length)])
    }

}
export function teardown(){
  // Cleanly shutdown and flush telemetry when k6 exits.
  tracing.shutdown();
}
