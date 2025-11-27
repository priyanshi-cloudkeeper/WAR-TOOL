# icons.py
"""
Icon mapping for GCP asset types → local PNG files in ./icons

You already have the icons folder with many files like:
- Compute-Engine.png
- Virtual-Private-Cloud.png
- Cloud-Firewall-Rules.png
- Cloud-Storage.png
- Identity-And-Access-Management.png
- Cloud-Functions.png
- Cloud-Run.png
- Google-Kubernetes-Engine.png
- BigQuery.png
- PubSub.png
- Cloud-SQL.png
- Cloud-Spanner.png
- Firestore.png
- Filestore.png
- Memorystore.png
- Dataflow.png
- Dataproc.png
- Dataplex.png
- Datastream.png
- Cloud-Data-Fusion.png
- Cloud-Logging.png
- Cloud-Monitoring.png
- Cloud-Armor.png
- Cloud-Load-Balancing.png
- Cloud-DNS.png
- Cloud-VPN.png
- Cloud-Interconnect.png
- Cloud-NAT.png
- Cloud-API-Gateway.png
- Artifact-Registry.png
- Container-Registry.png
- Cloud-Build.png
- Cloud-Deploy.png
- Cloud-Scheduler.png
- Cloud-Tasks.png
- Cloud-Endpoints.png
- Secret-Manager.png
- Key-Management-Service.png
- Cloud-Natural-Language-API.png
- Cloud-Vision-API.png
- Speech-To-Text.png
- Text-To-Speech.png
- Vertex-AI.png
… and many more.

Extend this dictionary whenever you add more services.
"""

ICON_MAP = {
    # ------------------------------------------------------------------
    # Compute / VM / OS
    # ------------------------------------------------------------------
    "compute.googleapis.com/Instance": "icons/Compute-Engine.png",
    "compute.googleapis.com/Disk": "icons/Persistent-Disk.png",
    "compute.googleapis.com/Snapshot": "icons/Persistent-Disk.png",
    "compute.googleapis.com/Image": "icons/Compute-Engine.png",
    "compute.googleapis.com/RegionDisk": "icons/Persistent-Disk.png",
    "compute.googleapis.com/Address": "icons/Cloud-External-IP-Addresses.png",

    # ------------------------------------------------------------------
    # Networking
    # ------------------------------------------------------------------
    "compute.googleapis.com/Network": "icons/Virtual-Private-Cloud.png",
    "compute.googleapis.com/Subnetwork": "icons/Virtual-Private-Cloud.png",
    "compute.googleapis.com/Firewall": "icons/Cloud-Firewall-Rules.png",
    "compute.googleapis.com/Route": "icons/Cloud-Routes.png",
    "compute.googleapis.com/Router": "icons/Cloud-Router.png",
    "compute.googleapis.com/ForwardingRule": "icons/Cloud-Load-Balancing.png",

    "compute.googleapis.com/VpnTunnel": "icons/Cloud-VPN.png",
    "compute.googleapis.com/VpnGateway": "icons/Cloud-VPN.png",
    "compute.googleapis.com/VpnGatewayAttachment": "icons/Cloud-VPN.png",
    "compute.googleapis.com/Interconnect": "icons/Cloud-Interconnect.png",
    "compute.googleapis.com/InterconnectAttachment": "icons/Cloud-Interconnect.png",
    "compute.googleapis.com/NatGateway": "icons/Cloud-NAT.png",

    "networkservices.googleapis.com/LoadBalancer": "icons/Cloud-Load-Balancing.png",
    "networksecurity.googleapis.com/AuthorizationPolicy": "icons/Cloud-Network.png",
    "networkmanagement.googleapis.com/ConnectivityTest": "icons/Connectivity-Test.png",

    "dns.googleapis.com/ManagedZone": "icons/Cloud-DNS.png",
    "dns.googleapis.com/Policy": "icons/Cloud-DNS.png",

    # ------------------------------------------------------------------
    # Storage
    # ------------------------------------------------------------------
    "storage.googleapis.com/Bucket": "icons/Cloud-Storage.png",

    "file.googleapis.com/FileShare": "icons/Filestore.png",
    "file.googleapis.com/Instance": "icons/Filestore.png",

    # ------------------------------------------------------------------
    # Databases
    # ------------------------------------------------------------------
    "sqladmin.googleapis.com/Instance": "icons/Cloud-SQL.png",
    "spanner.googleapis.com/Instance": "icons/Cloud-Spanner.png",
    "spanner.googleapis.com/Database": "icons/Cloud-Spanner.png",
    "bigtableadmin.googleapis.com/Instance": "icons/Bigtable.png",
    "bigtableadmin.googleapis.com/Table": "icons/Bigtable.png",

    "firestore.googleapis.com/Database": "icons/Firestore.png",
    "datastore.googleapis.com/Index": "icons/Datastore.png",

    "redis.googleapis.com/Instance": "icons/Memorystore.png",

    # ------------------------------------------------------------------
    # Container / Kubernetes / Serverless
    # ------------------------------------------------------------------
    "container.googleapis.com/Cluster": "icons/Google-Kubernetes-Engine.png",
    "container.googleapis.com/NodePool": "icons/Google-Kubernetes-Engine.png",

    "run.googleapis.com/Service": "icons/Cloud-Run.png",
    "run.googleapis.com/Job": "icons/Cloud-Run.png",

    "cloudfunctions.googleapis.com/CloudFunction": "icons/Cloud-Functions.png",

    # ------------------------------------------------------------------
    # Messaging / Integration
    # ------------------------------------------------------------------
    "pubsub.googleapis.com/Topic": "icons/PubSub.png",
    "pubsub.googleapis.com/Subscription": "icons/PubSub.png",
    "pubsub.googleapis.com/Snapshot": "icons/PubSub.png",

    "eventarc.googleapis.com/Trigger": "icons/Eventarc.png",
    "integrations.googleapis.com/Integration": "icons/Connectors.png",

    # ------------------------------------------------------------------
    # Data / Analytics
    # ------------------------------------------------------------------
    "bigquery.googleapis.com/Dataset": "icons/BigQuery.png",
    "bigquery.googleapis.com/Table": "icons/BigQuery.png",
    "bigquery.googleapis.com/Job": "icons/BigQuery.png",
    "bigqueryreservation.googleapis.com/Reservation": "icons/BigQuery.png",
    "bigquerydatapolicy.googleapis.com/DataPolicy": "icons/BigQuery.png",

    "datafusion.googleapis.com/Instance": "icons/Cloud-Data-Fusion.png",
    "dataflow.googleapis.com/Job": "icons/Dataflow.png",
    "dataproc.googleapis.com/Cluster": "icons/Dataproc.png",
    "dataproc.googleapis.com/Job": "icons/Dataproc.png",
    "dataplex.googleapis.com/Lake": "icons/Dataplex.png",
    "dataplex.googleapis.com/Zone": "icons/Dataplex.png",

    "datastream.googleapis.com/Stream": "icons/Datastream.png",

    "analyticshub.googleapis.com/DataExchange": "icons/Analytics-Hub.png",

    # ------------------------------------------------------------------
    # DevOps / CI-CD / Artifacts
    # ------------------------------------------------------------------
    "cloudbuild.googleapis.com/Build": "icons/Cloud-Build.png",
    "cloudbuild.googleapis.com/Trigger": "icons/Cloud-Build.png",

    "deploy.googleapis.com/DeliveryPipeline": "icons/Cloud-Deploy.png",
    "deploy.googleapis.com/Target": "icons/Cloud-Deploy.png",

    "artifactregistry.googleapis.com/Repository": "icons/Artifact-Registry.png",
    "containerregistry.googleapis.com/Image": "icons/Container-Registry.png",

    "sourcerepo.googleapis.com/Repository": "icons/Cloud-Source-Repositories.png",

    "cloudscheduler.googleapis.com/Job": "icons/Cloud-Scheduler.png",
    "cloudtasks.googleapis.com/Queue": "icons/Cloud-Tasks.png",

    # ------------------------------------------------------------------
    # API Management & Networking Edge
    # ------------------------------------------------------------------
    "apigateway.googleapis.com/Api": "icons/Cloud-API-Gateway.png",
    "apigateway.googleapis.com/Gateway": "icons/Cloud-API-Gateway.png",

    "servicenetworking.googleapis.com/Connection": "icons/Private-Service-Connect.png",
    "servicedirectory.googleapis.com/Namespace": "icons/Service-Discovery.png",

    "endpoints.googleapis.com/Service": "icons/Cloud-Endpoints.png",

    # ------------------------------------------------------------------
    # Security / IAM / KMS / Secrets
    # ------------------------------------------------------------------
    "iam.googleapis.com/ServiceAccount": "icons/Identity-And-Access-Management.png",
    "iam.googleapis.com/Role": "icons/Identity-And-Access-Management.png",
    "iam.googleapis.com/Policy": "icons/Identity-And-Access-Management.png",

    "cloudkms.googleapis.com/CryptoKey": "icons/Key-Management-Service.png",
    "cloudkms.googleapis.com/KeyRing": "icons/Key-Management-Service.png",

    "secretmanager.googleapis.com/Secret": "icons/Secret-Manager.png",
    "secretmanager.googleapis.com/SecretVersion": "icons/Secret-Manager.png",

    "cloudresourcemanager.googleapis.com/Project": "icons/Project.png",
    "cloudresourcemanager.googleapis.com/Folder": "icons/Administration.png",
    "cloudresourcemanager.googleapis.com/Organization": "icons/Administration.png",

    "accesscontextmanager.googleapis.com/AccessPolicy": "icons/Access-Context-Manager.png",
    "accesscontextmanager.googleapis.com/ServicePerimeter": "icons/Access-Context-Manager.png",

    "securitycenter.googleapis.com/Finding": "icons/Security-Command-Center.png",
    "securitycenter.googleapis.com/Source": "icons/Security-Command-Center.png",

    "cloudarmor.googleapis.com/SecurityPolicy": "icons/Cloud-Armor.png",

    # ------------------------------------------------------------------
    # Observability / Logging / Monitoring
    # ------------------------------------------------------------------
    "logging.googleapis.com/LogBucket": "icons/Cloud-Logging.png",
    "logging.googleapis.com/LogSink": "icons/Cloud-Logging.png",
    "logging.googleapis.com/LogView": "icons/Cloud-Logging.png",

    "monitoring.googleapis.com/AlertPolicy": "icons/Cloud-Monitoring.png",
    "monitoring.googleapis.com/UptimeCheckConfig": "icons/Cloud-Monitoring.png",
    "monitoring.googleapis.com/NotificationChannel": "icons/Cloud-Monitoring.png",
    "monitoring.googleapis.com/Service": "icons/Cloud-Monitoring.png",

    "cloudtrace.googleapis.com/TraceSink": "icons/Trace.png",
    "errorreporting.googleapis.com/ErrorGroup": "icons/Error-Reporting.png",
    "profiler.googleapis.com/Profile": "icons/Profiler.png",
    "clouddebugger.googleapis.com/Debugger": "icons/Debugger.png",

    # ------------------------------------------------------------------
    # AI / ML
    # ------------------------------------------------------------------
    "aiplatform.googleapis.com/Endpoint": "icons/Vertex-AI.png",
    "aiplatform.googleapis.com/Model": "icons/Vertex-AI.png",
    "ml.googleapis.com/Model": "icons/AI-Platform.png",

    "vision.googleapis.com/ImageAnnotator": "icons/Cloud-Vision-API.png",
    "language.googleapis.com/LanguageService": "icons/Cloud-Natural-Language-API.png",
    "speech.googleapis.com/SpeechToText": "icons/Speech-To-Text.png",
    "texttospeech.googleapis.com/TextToSpeech": "icons/Text-To-Speech.png",

    # ------------------------------------------------------------------
    # Misc / Generic Cloud resources
    # ------------------------------------------------------------------
    "cloudscheduler.googleapis.com/Location": "icons/Cloud-Scheduler.png",
    "cloudtasks.googleapis.com/Location": "icons/Cloud-Tasks.png",
    "cloudsupport.googleapis.com/Case": "icons/Support.png",
}


def get_icon_for_asset_type(asset_type: str):
    """
    Return relative icon path for this asset type, or None.

    Includes a small fallback:
      - Exact match in ICON_MAP
      - If not found, try by service prefix (compute, storage, pubsub, container, etc.)
    """
    if not asset_type:
        return None

    # 1. Exact match
    if asset_type in ICON_MAP:
        return ICON_MAP[asset_type]

    # 2. Fallbacks by prefix
    if asset_type.startswith("compute.googleapis.com/"):
        return ICON_MAP.get("compute.googleapis.com/Instance")

    if asset_type.startswith("storage.googleapis.com/"):
        return ICON_MAP.get("storage.googleapis.com/Bucket")

    if asset_type.startswith("sqladmin.googleapis.com/"):
        return ICON_MAP.get("sqladmin.googleapis.com/Instance")

    if asset_type.startswith("bigquery.googleapis.com/"):
        return ICON_MAP.get("bigquery.googleapis.com/Dataset")

    if asset_type.startswith("pubsub.googleapis.com/"):
        return ICON_MAP.get("pubsub.googleapis.com/Topic")

    if asset_type.startswith("container.googleapis.com/"):
        return ICON_MAP.get("container.googleapis.com/Cluster")

    if asset_type.startswith("run.googleapis.com/"):
        return ICON_MAP.get("run.googleapis.com/Service")

    if asset_type.startswith("cloudfunctions.googleapis.com/"):
        return ICON_MAP.get("cloudfunctions.googleapis.com/CloudFunction")

    if asset_type.startswith("spanner.googleapis.com/"):
        return ICON_MAP.get("spanner.googleapis.com/Instance")

    if asset_type.startswith("bigtableadmin.googleapis.com/"):
        return ICON_MAP.get("bigtableadmin.googleapis.com/Instance")

    if asset_type.startswith("firestore.googleapis.com/"):
        return ICON_MAP.get("firestore.googleapis.com/Database")

    if asset_type.startswith("redis.googleapis.com/"):
        return ICON_MAP.get("redis.googleapis.com/Instance")

    if asset_type.startswith("apigateway.googleapis.com/"):
        return ICON_MAP.get("apigateway.googleapis.com/Api")

    if asset_type.startswith("logging.googleapis.com/"):
        return ICON_MAP.get("logging.googleapis.com/LogBucket")

    if asset_type.startswith("monitoring.googleapis.com/"):
        return ICON_MAP.get("monitoring.googleapis.com/AlertPolicy")

    if asset_type.startswith("iam.googleapis.com/"):
        return ICON_MAP.get("iam.googleapis.com/ServiceAccount")

    if asset_type.startswith("cloudkms.googleapis.com/"):
        return ICON_MAP.get("cloudkms.googleapis.com/CryptoKey")

    if asset_type.startswith("secretmanager.googleapis.com/"):
        return ICON_MAP.get("secretmanager.googleapis.com/Secret")

    if asset_type.startswith("dns.googleapis.com/"):
        return ICON_MAP.get("dns.googleapis.com/ManagedZone")

    if asset_type.startswith("cloudbuild.googleapis.com/"):
        return ICON_MAP.get("cloudbuild.googleapis.com/Build")

    if asset_type.startswith("deploy.googleapis.com/"):
        return ICON_MAP.get("deploy.googleapis.com/DeliveryPipeline")

    if asset_type.startswith("artifactregistry.googleapis.com/"):
        return ICON_MAP.get("artifactregistry.googleapis.com/Repository")

    if asset_type.startswith("containerregistry.googleapis.com/"):
        return ICON_MAP.get("containerregistry.googleapis.com/Image")

    if asset_type.startswith("dataflow.googleapis.com/"):
        return ICON_MAP.get("dataflow.googleapis.com/Job")

    if asset_type.startswith("dataproc.googleapis.com/"):
        return ICON_MAP.get("dataproc.googleapis.com/Cluster")

    if asset_type.startswith("dataplex.googleapis.com/"):
        return ICON_MAP.get("dataplex.googleapis.com/Lake")

    if asset_type.startswith("datastream.googleapis.com/"):
        return ICON_MAP.get("datastream.googleapis.com/Stream")

    if asset_type.startswith("datafusion.googleapis.com/"):
        return ICON_MAP.get("datafusion.googleapis.com/Instance")

    # No idea – let the front-end fall back to colored box
    return None
