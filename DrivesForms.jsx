import React, { useEffect, useState , useRef} from "react";
import DriveInfoPopup from "./DriveInfoPopup/DriveInfoPopup";
import styles from "./DriveForms.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllDrives, fetchAllForms, resetError, resetSuccess } from "../../../store/features/tools/driveSlice";
import CreateDrivePopup from "./CreateDrivePopup/CreateDrivePopup";
import CreateFormPopup from "./CreateFormPopup/CreateFormPopup";
import { showToast } from "../../../store/features/toast/toastSlice";
import axios from "axios";
import { Modal } from 'antd';
import { FileAddOutlined } from '@ant-design/icons';
import { openDB } from 'idb';
import AWS from 'aws-sdk';
import * as idb from 'idb';



const minioEndpoint = 'http://10.8.0.13:9000';
const accessKey = 'minioadmin';
const secretKey = 'minioadmin';
const bucketName = 'test';

AWS.config.update({
  accessKeyId: accessKey,
  secretAccessKey: secretKey,
  endpoint: minioEndpoint,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

const s3 = new AWS.S3();

const minioUploader = async (file, fileName) => {
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: file,
      ContentType: file.type,
      ContentDisposition: `attachment; filename="${fileName}"`,
    };
  
    try {
      const response = await s3.upload(params).promise();
      return response.Location; // Assuming MinIO provides the URL in the response
    } catch (error) {
      console.error('Error uploading to MinIO:', error);
      throw error;
    }
  };
  



const DrivesForms = () => {
    const [ popupVisible, setPopupVisible] = useState(false);
    const [ createDrivePopup, setCreateDrivePopup ] = useState(false);
    const [ createFormPopup, setCreateFormPopup ] = useState(false);
    const [driveList, setDriveList] = useState([]);
    const [formList, setFormList] = useState([]);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const onlineHandlerExecuted = useRef(false);
    const dispatch = useDispatch();
  

    // const success = useSelector(state => state.drive.success);
    // const error = useSelector(state => state.drive.error);


  

    const driveData = {
        title: "Existing Drives",
        listItems: []
    };
    const [ formData, setFormData ] = useState({
        title: "Existing Forms",
        listItems: []
    });

    // driveData.listItems = useSelector(state => state.drive.driveList);
    // formData.listItems = useSelector(state => state.drive.formList);
    
     // useRef to track whether online handler has been executed

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (success) {
            dispatch(showToast({ toastType: "success", toastMessage: success }));
            setSuccess(null);
        }
        if (error) {
            dispatch(showToast({ toastType: "error", toastMessage: error }));
            setError(null);
        }
    }, [success, error, dispatch]);

    useEffect(() => {
        const onlineEventHandler = async () => {
            if (!onlineHandlerExecuted.current) { // Check if online handler has been executed
                console.log('online');
                const lastSynchronizedTimestamp = sessionStorage.getItem('lastSynchronizedTimestamp');
    
                const lastSyncDate = new Date(parseInt(lastSynchronizedTimestamp));
                console.log("lastSynchronizedTimestamp:", lastSyncDate.toLocaleString()); // Convert to normal date format
    
                console.log("lastSynchronizedTimestamp:", lastSyncDate);
                if (lastSynchronizedTimestamp) {
                    try {
                        // Get offline data since the last synchronized timestamp
                        const offlineData = await getOfflineDataSince(lastSyncDate);
                        // Synchronize offline data with MongoDB
                        await synchronizeOfflineData(offlineData);
                        // Update last synchronized timestamp to current time
                        const currentTimestamp = Date.now();
                        sessionStorage.setItem('lastSynchronizedTimestamp', currentTimestamp);
                        // Mark online handler as executed
                        onlineHandlerExecuted.current = true;
                    } catch (error) {
                        console.error('Error handling offline data:', error);
                    }
                }
            }
        };
    
        window.addEventListener('online', onlineEventHandler);
    
        // Cleanup function to remove event listener
        return () => {
            window.removeEventListener('online', onlineEventHandler);
        };
    }, []);
    
    const handleOffline = () => {
        // Browser went offline, set session storage item
        const currentTimestamp = Date.now();
        sessionStorage.setItem('lastSynchronizedTimestamp', currentTimestamp);
    };
    
    window.addEventListener('offline', handleOffline);
    
    const fetchData = async () => {
        try {
            // Check network status
            const isOnline = navigator.onLine;
    
            if (isOnline) {
                // Fetch data from MongoDB
                const response = await axios.get('http://127.0.0.1:5000/api/get-data');
                console.log(response.data);
                if (response.status === 200) {
                    const data = response.data;
                    // Update both formList state variable and formData.listItems
                    setFormList(data);
                    setFormData(prevState => ({
                        ...prevState,
                        listItems: data
                    }));
                }
            } else {
                // Fetch data from IndexedDB
                const indexedDBData = await fetchDataFromIndexedDB();
                // Update both formList state variable and formData.listItems
                setFormList(indexedDBData);
                setFormData(prevState => ({
                    ...prevState,
                    listItems: indexedDBData
                }));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to fetch data.');
        }
    };
    
    const getOfflineDataSince = async (timestamp) => {
        try {
            const db = await openDB('formDataDB', 1);
            const store = db.transaction('formDataStore').objectStore('formDataStore');
    
            // Get all data from the store
            const allData = await store.getAll();
    
            console.log('Retrieved all offline data:', allData);
    
            // Filter data since the provided timestamp
            const filteredData = allData.filter(entry => new Date(entry.timestamp) > timestamp);
    
            console.log('Filtered offline data:', filteredData);
    
            return filteredData;
        } catch (error) {
            console.error('Error getting offline data:', error);
            return [];
        }
    };
    
    
    
    const synchronizeOfflineData = async (data) => {
        try {
            // Check if data is iterable
            if (data && typeof data[Symbol.iterator] === 'function') {
                // Synchronize offline data with MongoDB
                for (const formData of data) {
                    // Convert image URL and audio URL from base64 to MinIO URLs
                    // console.log(formData.imageUrl)
                    // console.log(formData.modalAudioUrl)
                    console.log(data)
                    if (formData.imageUrl && formData.modalAudioUrl) {
                        // Assuming formData.imageUrl and formData.audioUrl are base64 strings
                        const imageFileName = `image_${Date.now()}.png`;
                        const audioFileName = `audio_${Date.now()}.wav`;
                        
                        // Decode base64 data to binary data
                        const imageData = base64ToBinary(formData.imageUrl.split(',')[1]);
                        const audioData = base64ToBinary(formData.modalAudioUrl.split(',')[1]);
                        // Upload image and audio to MinIO
                        const imageMinioUrl = await minioUploader(imageData, imageFileName, 'image/png');
                        const audioMinioUrl = await minioUploader(audioData, audioFileName, 'audio/wav');
                    
                        // Update formData with MinIO URLs
                        formData.imageUrl = imageMinioUrl;
                        formData.modalAudioUrl = audioMinioUrl;
                    
                        // Post formData to MongoDB
                        await postDataToMongoDB(formData);
                        updateIndexedDB(formData.id, {
                            imageUrl: imageMinioUrl,
                            modalAudioUrl: audioMinioUrl
                        });
                      
                    }
                    
                }
                console.log('Offline data synchronized successfully.');
            } else {
                console.log('No offline data to synchronize.');
            }
        } catch (error) {
            console.error('Error synchronizing offline data:', error);
        }
    };
  // Assuming formData.id contains the correct id value
const updateIndexedDB = async (id, imageUrl, modalAudioUrl) => {
    try {
        // Open IndexedDB database
        const db = await idb.openDB('formDataDB', /*version=*/ 1);

        // Access the object store
        const tx = db.transaction('formDataStore', 'readwrite');
        const store = tx.objectStore('formDataStore');
        console.log(store)

        // Fetch the record with the given id
        const record = await store.get(id);
        console.log(record)

        // Update the fields
        if (record) {
            record.imageUrl = imageUrl;
            record.modalAudioUrl = modalAudioUrl;

            // Put the updated record back into the object store
            await store.put(record);
            console.log(`Record with id ${id} updated successfully.`);
        } else {
            console.log(`Record with id ${id} not found.`);
        }

        // Close the transaction and database connection
        await tx.done;
        db.close();
    } catch (error) {
        console.error('Error updating record:', error);
    }
};

// Example usage:
// Assuming formData.id, imageMinioUrl, and audioMinioUrl are defined elsewhere




    function base64ToBinary(base64String) {
        const byteCharacters = atob(base64String);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        return new Uint8Array(byteNumbers);
    }
    
    
    const postDataToMongoDB = async (data) => {
        try {
            // Add timestamp to the data
            const timestampedData = { timestamp: new Date(), ...data };
    
            const response = await axios.post('http://127.0.0.1:5000/api/save-data', timestampedData);
            if (response.status === 200) {
                console.log('Form data submitted to MongoDB successfully!');
            } else {
                console.error('Failed to submit form data to MongoDB.');
            }
        } catch (error) {
            console.error('Error posting data to MongoDB:', error);
        }
    };
    
    const fetchDataFromIndexedDB = async () => {
        try {
            // Open IndexedDB database
            const db = await openDB('formDataDB', 1);
            // Retrieve data from object store
            const data = await db.getAll('formDataStore');
            console.log('Form data retrieved from IndexedDB:', data);
            return data;
        } catch (error) {
            console.error('Error fetching data from IndexedDB:', error);
            return [];
        }
    };
    

    // useEffect(() => {
    //     dispatch(fetchAllDrives());
    //     dispatch(fetchAllForms());
    // }, [dispatch]);


    // useEffect(()=>{
    //     if(success){
    //         dispatch(showToast({toastType: "success", toastMessage: success['success']}));
    //         dispatch(resetSuccess())
    //     }
    //     if(error){
    //         dispatch(showToast({toastType: "error", toastMessage: error['error']}));
    //         dispatch(resetError());
    //     }
    // },[success, error, dispatch]);

    const handleCreate = (label) => {
        console.log("Create", label);
        switch (String(label).toLowerCase()) {
            case "drive":
                setCreateDrivePopup(true);
                break;
            case "form":
                setCreateFormPopup(true);
                break;
        
            default:
                console.log("Invalid label");
                break;
        }
    }

    const onCreateFormHandler = () => {
        console.log("here");
        setCreateDrivePopup(false);
        CreateFormPopup(true);
    }

    const handleUsernameClick = (item) => {
        setSelectedItem(item);
        setModalVisible(true);
        // setPopupVisible(true);
    };
    
    const listTemplate = (listItems) => {
        return (
            <div className={styles.listSection}>
                <div className={styles.title}>Existing Forms</div>
                <div className={styles.list}>
                    {listItems.length === 0 && <div style={{ padding: '15px' }}>No records found</div>}
                    {listItems.length > 0 && listItems.map((item, idx) => (
                        <div className={styles.item} key={idx}>
                            <div className={styles.info}>
                                <div className={styles.name} onClick={() => handleUsernameClick(item)}>Username: {item.username}</div>
                                {/* <div className={styles.createdDate}>Input Number: {item.inputNumber}</div>
                                <div className={styles.createdDate}>Gender: {item.gender}</div>
                                <img src={item.imageUrl} alt="Form Image" onClick={() => setPopupVisible(true)} /> */}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };
    
    console.log(formData.listItems)
    

    const ModalComponent = ({ item, onClose, visible }) => {
        const hasImageAndAudio = item.imageUrl && item.modalAudioUrl;
        return (
            <Modal
                visible={visible}
                onCancel={onClose}
                footer={null}
            >
                <div>
                    <span className="close" onClick={onClose}>&times;</span>
                    <div>Username: {item.username}</div>
                    <div>Input Number: {item.inputNumber}</div>
                    <div>Gender: {item.gender}</div>
                    <div>
    {hasImageAndAudio ? (
      <>
        <img src={item.imageUrl} alt="Form Image" style={{ width: '100%' }} />
        <audio controls>
          <source src={item.modalAudioUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </>
    ) : (
      <div>
        {!item.imageUrl && (
          <div>
            <p>Add Image</p>
            <FileAddOutlined />
          </div>
        )}
        {!item.modalAudioUrl && (
          <div>
            <p>Add Audio</p>
            <FileAddOutlined />
          </div>
        )}
      </div>
    )}
  </div>
                    {/* <img src={item.imageUrl} alt="Form Image" style={{ width: '100%' }} /> */}
                    {/* Display audio */}
                    {/* <audio controls>
                        <source src={item.modalAudioUrl
} type="audio/mpeg" />
                        Your browser does not support the audio element.
                    </audio> */}
                    {/* Other details */}
                </div>
            </Modal>
        );
    };
    
    
    

    return (
        <>
            {/* <h1>DrivesForms</h1> */}
            {createDrivePopup && <CreateDrivePopup onCreateFormClick={onCreateFormHandler} onClose={()=>{setCreateDrivePopup(false); dispatch(fetchAllDrives())}} />}
            {createFormPopup && <CreateFormPopup onClose={()=>{setCreateFormPopup(false); dispatch(fetchAllForms())}} />}
            {/* {popupVisible && <DriveInfoPopup onClose={()=>{setPopupVisible(false)}} />} */}
            { selectedItem && (
                <ModalComponent
                    item={selectedItem}
                   
                onClose={() => setModalVisible(false)}
                visible={modalVisible}
                    // onClose={() => setPopupVisible(false)}
                />
            )}
            <div className={styles.container}>
                <div className={styles.actionButtonGrp}>
                    {["drive", "form"].map((label, idx) => (
                        <div className={styles.actionBtn} key={idx} onClick={()=>{handleCreate(label)}}>
                            <i className="pi pi-plus"></i>
                            <img src="/assets/icons/common/createform.svg" alt="create form" />
                            <div className={styles.label}>CREATE {label.toUpperCase()}</div>
                        </div>
                    ))}
                </div>
                <div className={styles.searchBar}>
                    <input type="text" />
                    <div className={styles.searchIcon}>
                        <i className="pi pi-search"></i>
                    </div>
                </div>
                <div className={styles.table}>
                    {driveData && listTemplate(driveData)}
                    {formData && listTemplate(formData.listItems)}
                </div>
            </div>
        </>
    );
}

export default DrivesForms; 