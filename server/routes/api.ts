/**
 * Copyright 2018 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const express = require('express');
const fs = require("fs");
import FleetClient from './FleetClient';
import * as fleetDomain from './fleetDomain';
import OrderClient from './OrderClient';
import * as orderDomain from './orderDomain';
import ProblemTopicConsumer from './ProblemTopicConsumer';
import ShipmentClient from './ShipmentClient';
import * as domain from './fleetDomain';
import Kafka from './kafka';

const orderClient = new OrderClient();
const fleetClient = new FleetClient();
const shipmentClient = new ShipmentClient();
const consumer = new ProblemTopicConsumer();

async function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

/** Export the APIs for the front end */
module.exports = function(app:any) {

  app.on('listening', function () {
  // server ready to accept connections here
  });


    // health verb for application monitoring.
    app.get('/healthz',(req:any,res:any) => {
      res.send('UP and running');
    });

    app.get('/api/problem', (req:any,res:any) => {
      console.log("In api problem topic consumer");
      const my = new Kafka();

      async function wait() {
        console.log("I am in wait");
        await delay(10000);
      }

      var x = my.kafka();

      wait().then(()=>{
        console.log("data"+x);
        // let probEvent: domain.ProblemReport = consumer.getProbEvent("JimminyCricket");
        // console.log(probEvent);
        // assert.isOk(probEvent);
        res.status(200).send("Here it is"+x);
      }).catch((error)=>{
        console.log(error);
      });

    });

    app.get('/api/fleets', (req:any,res:any) => {
        console.log("In api GET fleets");
        let fleets = [{id: "f1", name: "KC-NorthAtlantic"}, {id: "f2", name: "KC-NorthPacific"},{id: "f2", name: "KC-SouthPacific"}];
        fleetClient.getFleetNames().then((fleets: fleetDomain.Fleet[])=> {
            console.log("Got this " + JSON.stringify(fleets));
            res.status(200).send(fleets);
        });

    });

    app.get('/api/fleets/:fleetname', (req,res) => {
        console.log("In api GET fleet ships for " + req.params.fleetname);
        fleetClient.getFleetByName(req.params.fleetname).then( (aFleet: fleetDomain.Fleet) => {
            console.log("Got this " + JSON.stringify(aFleet));
            res.status(200).send(aFleet);
        });
    });



    app.post('/api/fleets/simulate', (req,res) => {
        console.log("In api POST fleets simulate " + JSON.stringify(req.body));
        if (req.body !== undefined) {
            fleetClient.fleetSimulation(req.body).then((data: fleetDomain.SimulResponse) => {
                res.status(200).send(data);
            });
        } else {
            res.status(400).send({error:'no post body'});
        }
    });


    app.post('/api/ships/simulate', (req,res) => {
        console.log("In api POST ship simulate " + JSON.stringify(req.body));
        if (req.body !== undefined) {
            fleetClient.shipSimulation(req.body).then((data: fleetDomain.Ship) => {
                console.log("In api POST ship simulate resp:" + JSON.stringify(data));
                res.status(200).send(data);
            });
        } else {
            res.status(400).send({error:'no post body'});
        }
    });

    // Orders
    app.get('/api/orders/:manuf',(req,res) => {
        console.log("In api GET orders for " + req.params.manuf);
        orderClient.getOrders(req.params.manuf).then( (orders: orderDomain.Order[]) => {
            console.log("Got this " + JSON.stringify(orders));
            res.status(200).send(orders);
        });
    });

    app.post('/api/orders',(req,res) => {
        console.log("In api POST new orders " + JSON.stringify(req.body));
        if (req.body !== undefined) {
            orderClient.saveOrder(req.body).then((data: orderDomain.Order) => {
                res.status(200).send(data);
            });
        }  else {
            res.status(400).send({error:'No POST body'});
        }
    });

    app.put('/api/orders/:orderID', (req, res) => {
        console.log("In api PUT existing order " + JSON.stringify(req.body));
        if (req.body !== undefined) {
            orderClient.updateOrder(req.body).then((data: orderDomain.Order) => {
                res.status(200).send(data);
            });
        }  else {
            res.status(400).send({error:'No PUT body'});
        }
    })

    app.get('/api/shipments',(req,res) => {
        console.log("In api GET all ordered shipments" );
        shipmentClient.getOrderedShipments().then( (orders: orderDomain.OrderedShipment[]) => {
            console.log("Got this " + JSON.stringify(orders));
            res.status(200).send(orders);
        });
    });
    app.put('/api/shipments/:orderID', (req,res) => {
        console.log("In api PUT existing order shipment " + JSON.stringify(req.body));
        if (req.body !== undefined) {
            shipmentClient.updateOrder(req.body).subscribe((data: orderDomain.OrderedShipment) => {
                res.status(200).send(data);
            });
        }  else {
            res.status(400).send({error:'No PUT body'});
        }
    });

    app.get('/api/voyages',(req,res) => {
        console.log("In api GET all scheduled voyages" );
        shipmentClient.getVoyages().subscribe( (voyages: orderDomain.Voyage[]) => {
            console.log("Got this " + JSON.stringify(voyages));
            res.status(200).send(voyages);
        });
    });

    app.get('/api/voyages/:voyageID',(req,res) => {
        console.log("In api GET voyage" + req.params.voyageID);
        shipmentClient.getVoyage(req.params.voyageID).subscribe( (voyage: orderDomain.Voyage) => {
            console.log("Got this " + JSON.stringify(voyage));
            res.status(200).send(voyage);
        });
    });
} // end exports
