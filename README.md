# The Autoscaling Workshop
This repository contains all the files for the workshop around Autoscaling in Kubernetes.

This repository showcase the usage of several solutions with Dynatrace:
* OpenCost
* Keptn lifecylce Toolkit
* HPA


## Prerequisite 
The following tools need to be install on your machine :
- jq
- kubectl
- git
- gcloud ( if you are using GKE)
- Helm

### 1.Create a Google Cloud Platform Project
```shell
PROJECT_ID="<your-project-id>"
gcloud services enable container.googleapis.com --project ${PROJECT_ID}
gcloud services enable monitoring.googleapis.com \
cloudtrace.googleapis.com \
clouddebugger.googleapis.com \
cloudprofiler.googleapis.com \
--project ${PROJECT_ID}
```
### 2.Create a GKE cluster
```shell
ZONE=europe-west3-a
NAME=autoscaling-workshop
gcloud container clusters create ${NAME} --zone=${ZONE} --machine-type=e2-standard-8 --num-nodes=2
```
### 3.Clone Github repo
```shell
git clone https://github.com/henrikrexed/Autoscaling-workshop
cd Autoscaling-workshop
```
### 4. Deploy 

#### 2. Dynatrace 
##### 1. Dynatrace Tenant - start a trial
If you don't have any Dynatrace tenant , then i suggest to create a trial using the following link : [Dynatrace Trial](https://bit.ly/3KxWDvY)
Once you have your Tenant save the Dynatrace (including https) tenant URL in the variable `DT_TENANT_URL` (for example : https://dedededfrf.live.dynatrace.com)
```shell
DT_TENANT_URL=<YOUR TENANT URL>
```
##### 2. Create the Dynatrace API Tokens
The dynatrace operator will require to have several tokens:
* Token to deploy and configure the various components
* Token to ingest metrics and Traces


###### Operator Token
One for the operator having the following scope:
* Create ActiveGate tokens
* Read entities
* Read Settings
* Write Settings
* Access problem and event feed, metrics and topology
* Read configuration
* Write configuration
* Paas integration - installer downloader
<p align="center"><img src="/image/operator_token.png" width="40%" alt="operator token" /></p>

Save the value of the token . We will use it later to store in a k8S secret
```shell
API_TOKEN=<YOUR TOKEN VALUE>
```
###### Ingest data token
Create a Dynatrace token with the following scope:
* Ingest metrics (metrics.ingest)
* Ingest logs (logs.ingest)
* Ingest events (events.ingest)
* Ingest OpenTelemetry
* Read metrics
<p align="center"><img src="/image/data_ingest_token.png" width="40%" alt="data token" /></p>
Save the value of the token . We will use it later to store in a k8S secret

```shell
DATA_INGEST_TOKEN=<YOUR TOKEN VALUE>
```
#### 3. Run the deployment script
```shell
cd ..
chmod 777 deployment.sh
./deployment.sh  --clustername "${NAME}" --dturl "${DT_TENANT_URL}" --dtingesttoken "${DATA_INGEST_TOKEN}" --dtoperatortoken "${API_TOKEN}"
```

### 6. Optimize the Ressources 

#### a. Deploy the the Dynatrace Dashboards

First let's start with the cluster efficiency Dashboard :
```shell
curl -X 'POST' \
'${DT_TENANT_URL}/api/config/v1/dashboards' \
-H 'accept: application/json; charset=utf-8' \
-H 'Content-Type: application/json; charset=utf-8' \
-H 'Authorization: Api-Token ${API_TOKEN}'\
-d @dynatrace/Cluster efficiency.json'
```
then the K6 dashboard:
```shell
curl -X 'POST' \
'${DT_TENANT_URL}/api/config/v1/dashboards' \
-H 'accept: application/json; charset=utf-8' \
-H 'Content-Type: application/json; charset=utf-8' \
-H 'Authorization: Api-Token ${API_TOKEN}'\
-d @dynatrace/K6 load test.json'
```

#### b. Look at the dashboard "Cluster effiency"
<p align="center"><img src="/image/cluster_efficiency.png" width="40%" alt="data token" /></p>

We can see that the deployed workload is not efficient and the namespace hipster-shop is the most expensive.
We can reduce the cost of the cluster by modifying the request & limits.
#### c. Reduce the cost of the Hipster-shop namespace
The repository has another version of the hipster-shop deployment file having lower value for the ressource :
* requests
* limit
Let's apply the update version of the hipster-shop :

```shell
kubectl apply -f hipstershop/k8s-manifest.yaml -n hipster-shop
```


#### d. Run a rampup test 
```shell
kubectl apply -f k6/loadtest_job.yaml -n hipster-shop
```

### 7. Autoscaling

To handle the load properly let's deploy some HPA rules on the following deployments :
* frontend
* productcalalogservice
* cartservice
* checkoutservice
* recommendationservice
  let's stop the load test started :
```shell
kubectl delete -f k6/loadtest_job.yaml -n hipster-shop
```
#### a. Deploy the HPA rule
```shell
kubectl apply -f hpa/hpa_cpu.yaml-n hipster-shop
```
#### b. Run a Load test
```shell
kubectl apply -f k6/loadtest_job.yaml -n hipster-shop
```
#### c. Impact of the HPA on default ressource metrics

let's stop the load test started :
```shell
kubectl delete -f k6/loadtest_job.yaml -n hipster-shop
```

By looking at Dynatrace, we can see that :
* the cost of the cluster has increased
* we have pending workload
* we still have performance issues

### 7. Autoscaling with the Keptn Metric server

Let's remove The hipster-shop to make sure all our workload has only 1 replica
```shell
kubectl delete -f hpa/hpa_cpu.yaml-n hipster-shop
kubectl delete -f hipstershop/k8s-manifest.yaml -n hipster-shop
sleep 5
kubectl apply -f hipstershop/k8s-manifest.yaml -n hipster-shop
```
#### a. Deploy the KeptnMetricProvider for Dynatrace
```shell
kubectl apply -f keptn/metricProvider.yaml -n hipster-shop
```

#### b. Let's create relevant KeptnMetrics for the Hipster-shop

In Dynatrace, let's create a metric expression to measure :
- the number of request coming in the frontend service
- the % of CPU throttling 


#### c. Let's deploy the KeptnMetrics using our metric expression
```shell
kubectl apply -f keptn/keptnmetric.yaml -n hipster-shop
```

#### d. let's Deploy our New HPA rules using our KeptnMetric
```shell
kubectl apply -f keptn/hpa.yaml -n hipster-shop
```

#### f. Let's run a loadtest
```shell
kubectl apply -f k6/loadtest_job.yaml -n hipster-shop
```

#### g. Let's create another HPA rules based on CPU throttling
```shell
kubectl delete -f keptn/hpa.yaml -n hipster-shop
kubectl delete -f k6/loadtest_job.yaml -n hipster-shop
kubectl delete -f hipstershop/k8s-manifest.yaml -n hipster-shop
sleep 5
kubectl apply -f hipstershop/k8s-manifest.yaml -n hipster-shop
```
Let's create our new Metrics:
```shell
kubectl apply -f keptn/v2/keptnmetric.yam -n hipster-shop
```
And create our new HPA rule:
```shell
kubectl apply -f keptn/v2/hpa.yaml -n hipster-shop
```
And let's run our new load test:
```shell
kubectl apply -f k6/loadtest_job.yaml -n hipster-shop
```