import React, { useCallback, useEffect, useState } from "react";
import { InputSwitch } from 'primereact/inputswitch';
import { OrganizationChart } from 'primereact/organizationchart';
import styles from "./DriveInfoPopup.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { fetchDriveDetails } from "../../../../store/features/tools/driveSlice";


const DriveInfoPopup = (props) => {

    const [ assistants, setAssistants ] = useState([]);
    const [ medicalAssistants, setMedicalAssistants ] = useState([]);
    const [ detailedView, setDetailedView ] = useState(false);
    const [ stationMap, setStationMap ] = useState({});
    const [ driveFlow, setDriveFlow ] = useState([]);

    const loading = useSelector(state => state.drive.loading);
    const driveDetails = useSelector(state => state.drive.driveDetails);
    
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(fetchDriveDetails());
    }, [dispatch]);

    const parseDriveDetails = useCallback((node, stationMap) => {
        let stationId = node.stationId;
        let randomColor = "#" + Math.floor(Math.random()*16777215).toString(16) + "60";
        //Check stationId not in stationMap
        if (stationId && !stationMap[stationId]) {
            stationMap[stationId] = {
                name: node.stationName,
                backgroundColor: randomColor,
                field: [
                    { name: node.fieldName, subField: [ ...node.subField ] }
                ]
            };
            node["bkgColor"] = randomColor;
        }
        else{
            stationMap[stationId].field.push(
                { name: node.fieldName, subField: [ ...node.subField ] }
            );
            node["bkgColor"] = stationMap[stationId].backgroundColor;
        }

        node["label"] = node.fieldName;
        node["className"] = "node";
        node["expanded"] = true;

        if (node.children && node.children.length > 0) {
            node.children.forEach((child) => {
                parseDriveDetails(child, stationMap);
            });
        }
    }, []);

    useEffect(() => {
        let stationsMap = {};
        let temp = JSON.parse(JSON.stringify(driveDetails));
        if(temp && Object.keys(temp).length > 0){
            parseDriveDetails(temp.nodes, stationsMap);
            setStationMap(stationsMap);
            setDriveFlow([temp.nodes]);
            setAssistants(temp.assistants);
            setMedicalAssistants(temp.medicalAssistants);
        }
    }, [driveDetails, parseDriveDetails]);

    const nodeTemplate = (node) => {
        return (
            <div>
                <div className={styles.node} style={{backgroundColor: node.bkgColor}}>
                    <div className={styles.item}>
                        {node.label}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.driveInfoContainer}>
            <div className={styles.drivePop}>
                {loading && <div className={styles.loader}>Loading...</div>}
                {!loading && <>
                    <div className={styles.driveIinfoHeader}>
                        {driveDetails.driveName}
                        <i className="pi pi-times-circle" onClick={props.onClose}></i>
                    </div>
                    <div className={styles.driveInfoSubHeader}>
                        <div className={styles.actions}>
                            <div className={styles.actionItem}>Restart Drive</div>
                            <div className={styles.actionItem}>Edit</div>
                            <div className={styles.actionItem}>Duplicate</div>
                            <div className={styles.actionItem}>Create Sub-Drive</div>
                            <div className={styles.actionDelete}>
                                <img src="/assets/icons/common/delete.svg" alt="delete" />
                            </div>
                        </div>
                        <div className={styles.timeInfo}>
                            <div className={styles.timeItem}>Created By: {driveDetails.createdBy}</div>
                            <div className={styles.timeItem}>Created Date: {driveDetails.createdDate}</div>
                        </div>

                    </div>
                    <div className={styles.driveInfoBody}>
                        <div className={styles.stationsGroup}>
                            <div className={styles.stationsList}>
                                {Object.keys(stationMap).map((key, idx) => (
                                    <div className={styles.stationItem} key={idx} 
                                        style={{backgroundColor: stationMap[key].backgroundColor}}>
                                        <div className={styles.title}>{stationMap[key].name}</div>
                                        {stationMap[key].field.map((field, idx) => (
                                            <div className={styles.fieldBox} key={idx}>
                                                <div className={styles.fieldTitle}>Field {field.name}</div>
                                                <div className={styles.subFieldList}>
                                                    {field.subField.map((sfName, idx) => (
                                                        <div className={styles.subField} key={idx}>
                                                            {sfName}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={styles.driveFlow}>
                            <div className={styles.title}>Drive Flow</div>
                            <div>
                                {driveFlow && driveFlow.length>0 && <OrganizationChart aria-expanded={true}
                                    value={driveFlow} 
                                    nodeTemplate={nodeTemplate}></OrganizationChart>}
                            </div>
                        </div>
                    </div>
                    <div className={styles.driveInfoFooter}>
                        <div className={styles.personnel}>
                            <div className={styles.heading}>
                                <div className={styles.title}>Personnel Assigned</div>
                                <div className={styles.toggleButton}>
                                    <div className={styles.label}>Detailed View</div>
                                    <InputSwitch checked={detailedView} onChange={(e) => setDetailedView(e.value)} />
                                </div>
                            </div>
                            <div className={styles.section}>
                                <div className={styles.title}>Assistants</div>
                                <div className={styles.list} style={{flexDirection: detailedView?"column":"row", flexWrap: detailedView?"nowrap":"wrap"}}>
                                    {assistants.map((item, idx) => (
                                        <div className={styles.item} key={idx}>
                                            <div className={styles.details}>
                                                {item.name}
                                            </div>
                                            {detailedView && <div className={styles.details}>
                                                {item.contact}
                                            </div>}
                                            {detailedView && <div className={styles.details}>
                                                {item.email}
                                            </div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.section}>
                                <div className={styles.title}>Medical Assistants</div>
                                <div className={styles.list} style={{flexDirection: detailedView?"column":"row", flexWrap: detailedView?"nowrap":"wrap"}}>
                                    {medicalAssistants.map((item, idx) => (
                                        <div className={styles.item} key={idx}>
                                            <div className={styles.details}>
                                                {item.name}
                                            </div>
                                            {detailedView && <div className={styles.details}>
                                                {item.contact}
                                            </div>}
                                            {detailedView && <div className={styles.details}>
                                                {item.email}
                                            </div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>}
            </div>
        </div>
    );
};

export default DriveInfoPopup;