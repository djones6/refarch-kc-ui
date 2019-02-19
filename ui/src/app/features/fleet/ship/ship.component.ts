import { Component, OnInit, Input } from '@angular/core';
import { Observable, Subject, of, throwError } from 'rxjs';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Ship } from './ship';
import { Container } from './container';
import { ViewChild, ElementRef } from '@angular/core';
import { FleetService } from '../fleet.service';
import { Router } from '@angular/router';
import { Problem } from './problem';
import { map, catchError } from  'rxjs/operators';

async function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

@Component({
  selector: 'app-ship',
  templateUrl: './ship.component.html',
  styleUrls: ['./ship.component.css']
})
export class ShipComponent implements OnInit {

  ship: Ship;
  img: HTMLImageElement;
  canvasH:number = 200;
  canvasW:number = 230;

  problemUrl: string = "http://localhost:3110/api/problem";
  headers: HttpHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });
  problems: Problem[] = [];
  containers: Container[] = [];
  message: string;
  probString: string[] =[];

  @ViewChild('myCanvas') myCanvas: ElementRef;
  public context: CanvasRenderingContext2D;

  constructor(private router: Router, private service: FleetService, private http: HttpClient) {
    this.ship = this.service.getSelectedShip();
    const rows = this.ship.maxRow;
    const cols = this.ship.maxColumn;
    this.img= new Image();
    this.img.src = 'assets/images/ship2.png';
  }

  ngAfterViewInit(): void {
    this.context = (<HTMLCanvasElement>this.myCanvas.nativeElement).getContext('2d');
    this.img.onload = ()=> {
      this.context.drawImage(this.img, 0, this.canvasH-80,220,80);
  }
    this.draw();
  }

  draw() {
    this.context.clearRect(0, 0, this.canvasW, this.canvasH);
    this.context.drawImage(this.img, 0, this.canvasH-80,220,80);
    this.drawMatrix();
  }

  ngOnInit(){

  }

  /*
  Call back so when the simulation is started the ship component can start listening to problem or containers
  The ship instance now has loaded containers.
  */
  doneSimul(){
    this.ship = this.service.getSelectedShip();

    async function wait() {
      console.log("I am in wait simulation");
      await delay(50000);
    }

    this.listenToContainerOrProblem().subscribe(data => {
      console.log("I am in subscribe of problemdata");
      this.probString = data;
      console.log("listen to container problem"+this.probString);
    }, error => {
      this.message = "Error retrieving problems";
    });

    wait().then(()=>{
      console.log("data is old"+this.probString);
      var topRow = this.ship.containers.length-1;
      for(var i=topRow; i >= 0; --i){
        let row = this.ship.containers[i];
        console.log("Row info "+row+ " "+i);
        for(var j=0; j <= row.length -1; j++){
          console.log("value of j at position i "+i+" is"+j);
          console.log("The container status is "+this.ship.containers[i][j].status);
          for(var k = 0; k< this.probString.length; k++){
            var x = this.probString[k];
            var prob : Problem = JSON.parse(x);
            console.log("Problem container id is "+prob.containerId+" with status"+prob.issue);
            console.log("Problem container id is "+prob.containerId+" with ship container id"+this.ship.containers[i][j].id);
            if (prob.containerId == this.ship.containers[i][j].id){
              console.log("Status before change "+this.ship.containers[i][j].status);
              console.log("Doing "+this.ship.containers[i][j].status+" = "+ prob.issue);
              this.ship.containers[i][j].status = prob.issue;
              console.log("Status after change "+this.ship.containers[i][j].status);
            }
          }
        }
      }
      this.draw();
    }).catch((error)=>{
      console.log(error);
    });

  }

  getEachContainerProblem(problemData: Problem[], cid: string){
    for (var i = 0; i < problemData.length; i++){
      if (problemData[i].containerId == cid){
        console.log("okay now I am in getEach"+problemData[i]);
        return problemData[i];
      }
    }
  }

  listenToContainerOrProblem(){
    // call BFF to get problems and container update
    console.log("In the listener problem");
    if (this.probString.length == 0)  {
      return this.http.get<string[]>(this.problemUrl)
      .pipe(map(data => {
        this.probString = data;
        return this.probString;
      }))
    }
    return of(this.probString);
    //return this.http.get(this.problemUrl).subscribe(response => console.log("I am getting returned"+response+" "+typeof response));
  }

  back() {
    this.router.navigate(['fleets']);
  }


  drawMatrix() {
    var cellWt = 180 / (this.ship.maxColumn+1);
    var cellHt = 180 / (this.ship.maxRow+1);
    var topRow = this.ship.containers.length-1;
    for(var i=topRow; i >= 0; --i){
      let y = this.canvasH - 20 - (i+1) * cellHt;
      let row = this.ship.containers[i];
      for(var j=0; j <= row.length -1; j++){
        let x = 30 + (j+1)* cellWt;
        let container: Container = row[j];
        this.generateBorder(x, y, cellWt, cellHt);
        this.context.fillStyle = this.containerColor(container.status);
        this.context.fillRect(x , y , cellWt, cellHt);
      }
    }
  }

  containerColor(value) {
    if(value == 'empty'){
      return 'white';
    }
    if(value == 'FIRE'){
      return 'darkorange';
    }
    if(value == 'HEAT'){
      return 'crimson';
    }
    if(value == 'DOWN'){
      return 'red';
    }
    return 'grey';
  }

  generateBorder(cellWt, cellHt, cellwidth, cellheight, thick = 1) {
    this.context.fillStyle='#000';
    this.context.fillRect(cellWt - (thick), cellHt - (thick), cellwidth + (thick * 2), cellheight + (thick * 2));
  }



}
