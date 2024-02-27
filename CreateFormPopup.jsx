import React, { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { InputNumber,  Select , Input, Modal, Button, Checkbox, Form, Upload, message } from 'antd';
import { CameraOutlined, EditOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from "react-redux";
import styles from "./CreateFormPopup.module.scss";
import  { useRef } from 'react';
import Webcam from 'react-webcam';
import { AudioOutlined } from '@ant-design/icons';
import axios from "axios";
import { openDB } from 'idb';
import AWS from 'aws-sdk';

import { saveAs } from 'file-saver';

import { PickList } from 'primereact/picklist';
import { ListBox } from 'primereact/listbox';
import { fetchAllFields, saveFormData } from "../../../../store/features/tools/driveSlice";
import { MultiSelect } from "primereact/multiselect";
import { Steps } from 'primereact/steps';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { showToast } from "../../../../store/features/toast/toastSlice";

const SelectFieldTemplate = ({ control }) => {
    const [formData, setFormData] = useState({
        text: '',
        number: '',
        shape: '',
        image: null,
        audio: null,
      });
    const fieldList = useSelector(state => state.drive.fieldList);
    const [imgSrc, setImgSrc] = useState(null);
    const webcamRef = useRef(null);
    const [mirrored, setMirrored] = useState(false);
    const [permission, setPermission] = useState(false);
    const [stream, setStream] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [recording, setRecording] = useState(false); // State to track if audio recording is in progress
    const [modalVisible, setModalVisible] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState(null);
  const [saved, setSaved] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [visible, setVisible] = useState(false);
  const [componentDisabled, setComponentDisabled] = useState(true);
  const [modalAudioUrl, setModalAudioUrl] = useState('');
const [modalAudioVisible, setModalAudioVisible] = useState(false);
const [audioModalVisible, setAudioModalVisible] = useState(false);
const [audioFileName, setAudioFileName] = useState('');
const [audioTime, setAudioTime] = useState(0); // State to keep track of recording time
const audioTimerRef = useRef(null); // Reference to the timer interval
const [resetAndSaveEnabled, setResetAndSaveEnabled] = useState(true);
const [mediaRecorder, setMediaRecorder] = useState(null);
const [username, setUsername] = useState('');
const [inputNumber, setInputNumber] = useState('');
const [gender, setGender] = useState('');
const [mediaStream, setMediaStream] = useState(null);
const [audioPresent, setAudioPresent] = useState(false);



const { Option } = Select;
const [form] = Form.useForm();

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
  };

  try {
    await s3.upload(params).promise();
  } catch (error) {
    console.error('Error uploading to MinIO:', error);
    throw error;
  }
};


const onGenderChange = (value) => {
    switch (value) {
      case 'male':
        form.setFieldsValue({
          note: 'Hi, man!',
        });
        break;
      case 'female':
        form.setFieldsValue({
          note: 'Hi, lady!',
        });
        break;
      case 'other':
        form.setFieldsValue({
          note: 'Hi there!',
        });
        break;
      default:
    }
  };

  
const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

    const capture = () => {
        if (imgSrc) {
          // Display message asking user to reset the image
          Modal.info({
            title: 'Reset Image',
            content: 'Please reset the existing image before capturing a new one.',
          });
        } else {
          const imageSrc = webcamRef.current.getScreenshot();
          setImgSrc(imageSrc);
        }
      };
    
      const showModal = () => {
        setVisible(true);
      };
    
      const handleCancel = () => {
        setVisible(false);
      };

      const handleReset = () => {
        setImgSrc(null);
        setSaved(false);
        setImageUrl(null);
      };
      const resetAudio = () => {
        setAudioBlob(null); // Clear the recorded audio blob
        setRecording(false); // Reset recording state
        setModalAudioUrl(''); // Clear the audio modal URL
        // setModalAudioVisible(false); // Hide the audio modal
      };
    
     
      const handleSave = async () => {
        try {
          if (imgSrc) {
            const currentDate = new Date();
            const fileName = `image_${currentDate.getTime()}.png`;
      
            const byteString = atob(imgSrc.split(',')[1]);
            const arrayBuffer = new ArrayBuffer(byteString.length);
            const uint8Array = new Uint8Array(arrayBuffer);
            for (let i = 0; i < byteString.length; i++) {
              uint8Array[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([arrayBuffer], { type: 'image/png' });
      
            // Set states and messages only once
            setSaved(true);
            setVisible(false);
            message.success('Image uploaded successfully!');
      
            if (navigator.onLine) {
              await minioUploader(blob, fileName);
              const imagelink = `${minioEndpoint}/${bucketName}/${fileName}`;
              setImageUrl(imagelink);
            } else {
              // Handle offline mode gracefully, you might want to store the image locally for later upload
              setImageUrl(imgSrc);
              message.warning('You are currently offline. Image will be uploaded when online.');
            }
          } else {
            Modal.error({
              title: 'No Image Captured',
              content: 'Please capture an image before saving.',
            });
          }
        } catch (error) {
          // Handle different types of errors appropriately
          message.error('Failed to upload image.');
          console.error('Error:', error);
        }
      };
      
      
    
      const handleEditClick = () => {
        setVisible(true);
      };

      const handleOpenAudioModal = (audioUrl, fileName) => {
        setModalAudioUrl(audioUrl);
        setAudioFileName(fileName);
        setModalAudioVisible(true);
      };
      
      // Function to handle closing the audio modal
      const handleCloseAudioModal = () => {
        setModalAudioVisible(false);
      };
       

      const handleEditAudio = () => {
        // Implement logic to handle editing audio
        // For example, you might want to open a modal or perform other actions
        setModalAudioVisible(true);
        // You can add your logic here to handle the edit action
      };
    
    

     

    
      const handleSaveAudio = async () => {
        try {
          if (audioBlob) {
            // Set the name of the saved audio file with current date and time
            const currentDate = new Date();
            const fileName = `audio_${currentDate.getTime()}.wav`;
      
            if (navigator.onLine) {
              // Upload the audio blob directly to MinIO
              await minioUploader(audioBlob, fileName);
              const audiolink = `${minioEndpoint}/${bucketName}/${fileName}`;
              setAudioFileName('recorded_audio.wav');
              setModalAudioUrl(audiolink);
      
              // Clear the recorded audio blob and reset recording state
              setAudioBlob(null);
              setRecording(false);
      
              // Display success message or perform any other action
              message.success('Audio recorded successfully and uploaded.');
            } else {
              // Store audio blob locally for offline use
      
              // Convert audio blob to base64 and store it locally
              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = () => {
                const base64Data = reader.result;
                // Store base64Data locally using localStorage or IndexedDB
                // localStorage.setItem('offlineAudio', base64Data);
                
                // Set the base64Data link
                setAudioFileName('recorded_audio.wav');
                setModalAudioUrl(base64Data);
              };
            }
          } else {
            // Display message asking the user to record audio first
            Modal.error({
              title: 'No Audio Recorded',
              content: 'Please record an audio before saving.',
            });
          }
        } catch (error) {
          // Handle error if upload fails
          message.error('Failed to upload audio.');
          console.error('Error:', error);
        }
      };
      
      
    
    const recordAudio = async () => {
    try {
      if (recording) {
        // If already recording, stop recording
        stopRecording();
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder); // Set mediaRecorder in state
      const audioChunks = [];

      recorder.addEventListener('dataavailable', event => {
        audioChunks.push(event.data);
      });

      recorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setRecording(false); // Reset recording state after recording stops
        // Show the recorded audio in a modal
        setModalAudioUrl(URL.createObjectURL(audioBlob));
        setModalAudioVisible(true);
        setResetAndSaveEnabled(false);
      });

      recorder.start();

      setRecording(true); // Set recording state to true when recording starts
    } catch (error) {
      console.error('Error recording audio:', error);
      setRecording(false); // Reset recording state if an error occurs
      setResetAndSaveEnabled(true);
    }
  };

  const stopRecording = () => {
    // Stop recording audio if in progress
    if (recording) {
      mediaRecorder.stop(); // Stop the media recorder
      setRecording(false);
      setAudioBlob(null);
      // Enable the Save and Reset buttons after stopping recording
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      setResetAndSaveEnabled(false);
    }
  };
// window.lastSynchronizedTimestamp = null;

const handleSubmit = async () => {
    console.log('inside');
   
    try {
        const formData = {
            username: username,
            inputNumber: inputNumber,
            gender: gender,
            imageUrl: imageUrl,
            audioFileName: audioFileName,
            modalAudioUrl: modalAudioUrl
            // Add more fields as needed
        };
        console.log(formData);

        // Check network status
        const isOnline = navigator.onLine;

        if (isOnline) {
            // If online, store data in both IndexedDB and MongoDB
            await Promise.all([
                storeDataInIndexedDB(formData),
                postDataToMongoDB(formData)
            ]);

            // Update last synchronized timestamp
          
        } else {
            // If offline, store data only in IndexedDB
            await storeDataInIndexedDB(formData);
        }

        console.log('Form data stored successfully.');
        console.log(window.lastSynchronizedTimestamp)
        window.location.reload()
        
        

        // Proceed with any additional operations if needed

    } catch (error) {
        console.error('Error:', error);
    }
};
const storeDataInIndexedDB = async (data) => {
  try {
      // Generate a unique identifier
      const id = Date.now() + Math.random().toString(36).substring(2); // Simple unique ID

      // Add timestamp and id to the data
      const timestampedData = { id, timestamp: new Date(), ...data };

      // Open IndexedDB database
      const db = await openDB('formDataDB', 1, {
          upgrade(db) {
              // Create an object store if not exists
              db.createObjectStore('formDataStore', { autoIncrement: true });
          },
      });

      // Add timestamped data to object store
      await db.add('formDataStore', timestampedData);
      console.log('Form data stored in IndexedDB with timestamp and id.');
  } catch (error) {
      console.error('Error storing form data in IndexedDB:', error);
  }
};




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


      const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
          ...prevState,
          [name]: value,
        }));
      };    

      return (
        <div>
          <div className="container1">
            <div className="left">
              <Form
                name="basic"
                labelCol={{
                  span: 8,
                }}
                wrapperCol={{
                  span: 16,
                }}
                style={{
                  maxWidth: 600,
                }}
                initialValues={{
                  remember: true,
                }}
                autoComplete="off"
                // onFinish={onFinish}
                // onFinishFailed={onFinishFailed}
              >
                <Form.Item
                  label="Username"
                  name="username"
                  rules={[
                    {
                      required: true,
                      message: 'Please input your username!',
                    },
                  ]}
                >
                  <Input onChange={(e) => setUsername(e.target.value)}  />
                </Form.Item>
                <Form.Item
                  label="InputNumber"
                  name="InputNumber"
                  rules={[{ required: true, message: 'Please input!' }]}
                >
                  <InputNumber style={{ width: '100%' }}  onChange={(value) => setInputNumber(value)} />
                </Form.Item>
      
                <Form.Item
                  name="gender"
                  label="Gender"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                  <Select
                    placeholder="Select a option and change input text above"
                    onChange={(value) => {
                      setGender(value);
                      onGenderChange(value);
                    }}
                    allowClear
                  >
                    <Option value="male">male</Option>
                    <Option value="female">female</Option>
                    <Option value="other">other</Option>
                  </Select>
                </Form.Item>
              </Form>
            </div>
            <div className="right">
              <Form.Item label="Upload " style={{marginLeft:110}} valuePropName="fileList" getValueFromEvent={normFile}>
                {/* <Upload action="/upload.do" listType="picture-card"> */}
                {saved ? (
                  <>
                    <img
                      src={imageUrl}
                      alt="saved"
                      style={{ width: 100, height: 100, cursor: 'pointer' , marginLeft: 18 }}
                      onClick={() => {
                        setModalImageUrl(imageUrl);
                        setModalVisible(true);
                      }}
                    />
                    <EditOutlined onClick={handleEditClick} style={{ marginLeft: 18 }} />
                  </>
                ) : (
                  <button
                    style={{
                      border: 0,
                      background: 'none',
                    }}
                    type="button"
                    onClick={showModal}
                  >
                    <CameraOutlined />
                    <div
                      style={{
                        marginTop: 8,
                        marginLeft: 18,
                      }}
                    >
                      Click Picture
                    </div>
                  </button>
                )}
                
              </Form.Item>
              <Modal
                title="Capture Image"
                visible={visible}
                onCancel={handleCancel}
                footer={[
                  <Button key="reset" onClick={handleReset}>
                    Reset
                  </Button>,
                  <Button key="capture" type="primary" onClick={capture}>
                    Capture
                  </Button>,
                  <Button key="save" type="primary" onClick={handleSave}>
                    Save
                  </Button>,
                ]}
              >
                {imgSrc ? (
                  <img src={imgSrc} alt="webcam" />
                ) : (
                  <Webcam
                    height={600}
                    width={400}
                    ref={webcamRef}
                    mirrored={mirrored}
                    screenshotFormat="image/jpeg"
                    screenshotQuality={0.8}
                  />
                )}
              </Modal>
              <Modal
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
              >
                <img src={modalImageUrl} alt="modal" style={{ width: '100%' }} />
              </Modal>
              <Form.Item > 
              {!audioFileName && (

  <button
    style={{
      border: 0,
      background: 'none',
      cursor: 'pointer',
      marginLeft: 110
    }}
    type="button"
    onClick={handleOpenAudioModal}
  >
    <AudioOutlined />
    <div style={{ marginTop: 8 }}>Record Audio</div>
  </button>
              )}
</Form.Item>
<Form.Item>
  {audioFileName && (
    <div>
      <label>Audio:</label>
      <span
        style={{ textDecoration: 'underline', cursor: 'pointer' }}
        onClick={() => {
          setModalAudioUrl(URL.createObjectURL(audioBlob));
          setAudioModalVisible(true);
        }}
      >
        {audioFileName}
      </span>
      <EditOutlined onClick={handleEditAudio} style={{ marginLeft: 18 }} />
    </div>
    
  )}
</Form.Item>

<Modal


title="Record Audio"
visible={modalAudioVisible}
onCancel={handleCloseAudioModal}
footer={[
  <Button 
    key="toggle" 
    onClick={audioPresent ? () => alert('Please reset the audio before starting a new recording.') : (recording ? stopRecording : recordAudio)} 
    style={{ backgroundColor: recording ? 'red' : 'green' }} 
  >
    {recording ? 'Stop Recording' : 'Start Recording'}
  </Button>,
     
        <Button key="save" type="primary" onClick={handleSaveAudio}  
        >
          Save
        </Button>,
        <Button key="reset" onClick={resetAudio}
        >
          Reset
        </Button>
      ]}
    >
      {/* Display audio player if audioBlob is available */}
      {audioBlob && (
        <div>
          <audio controls>
            <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
          {/* <div>
            Recording Time: {formatTime(audioTime)}
          </div> */}
        </div>
      )}
      {/* Your audio recording component (e.g., Web Audio API) goes here */}
    </Modal>

 <Modal
        title="Audio Player"
        visible={audioModalVisible}
        onCancel={() => setAudioModalVisible(false)}
        footer={null}
      >
        <audio controls>
          <source src={modalAudioUrl} type="audio/wav" />
          Your browser does not support the audio element.
        </audio>
      </Modal>
      
              {/* <button onClick={recordAudio}>
                {recording ? 'Stop Recording' : 'Record Audio'}
              </button> */}
              {/* {audioBlob && (
                <div>
                  <label>Audio:</label>
                  <audio controls>
                    <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                  </audio>
                </div>
              )} */}
            </div>
          </div>
          <Button type="primary" style={{marginLeft: 110}} onClick={handleSubmit}>Submit</Button>
          {/* <button onClick={handleSubmit}>Submit</button> */}
        </div>
      );
              }
                  
                  
// 
const SelectSubFieldTemplate = ({control, getValues, setValue}) => {
    // let fields = { ...getValues("fieldArray"), selectedSubFieldDict: [] };
    // setValue("fieldArray", fields);
    let fields = getValues("fieldArray");
    console.log("field selected", fields);

    if(fields.length === 0){
        return (
            <div className={styles.selectSubField}>
                <div className={styles.body__title}>
                    Select SubFields for Chosen Fields
                </div>
                <div className={styles.selectSubField__error_message}>
                    No Field Selected in Previous step
                </div>
            </div>
        );
    }

    return (
        <div className={styles.selectSubField}>
            <div className={styles.body__title}>
                Select SubFields for Chosen Fields
            </div>
            <div className={styles.selectSubField__select}>
                {fields.map((field, idx) => (
                    <div className={styles.selectSubField__select__item} key={idx}>
                        <div className={styles.selectSubField__select__item__label}>
                            {field.fieldName}
                        </div>
                        <div className={styles.selectSubField__select__item__select}>
                            <Controller
                                name={`selectedSubFieldDict[id_${field.fieldId}]`}
                                control={control}
                                defaultValue={[]}
                                render={({ field }) => {
                                    console.log(fields[idx].subFieldArray);
                                    return (
                                        <ListBox className="subField_list" value={field.value} multiple
                                        placeholder="Select a City" 
                                        name="value" options={fields[idx].subFieldArray} 
                                        control={control} 
                                        onChange={(e) => {
                                            console.log(e);
                                            setValue(field.name, e.value);
                                        }}
                                        itemTemplate={(item) => (
                                            <div className={styles.picklist__item}>
                                                <span className="radio"></span>
                                                <div className="item">{item.subFieldName}</div>
                                            </div>
                                        )}
                                        />
                                    );
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const SelectStationTemplate = ({control, getValues, setValue, register}) => {
    let selectedSubFieldDict = getValues("selectedSubFieldDict");
    const selectedFieldArray = getValues("fieldArray");
    // console.log("selectedSubFieldDict selected", selectedSubFieldDict);

    const [numStations, setNumStations] = useState(getValues("numStations") || 0);
    const dispatch = useDispatch();

    const handleOptionSelection = useCallback((val, field, stnIdx) => {
        let stationData = getValues("stationData");
        let stationId = `id_${stnIdx}`;
        for(let key of Object.keys(stationData)){
            if(!stationData[key] || key === stationId){
                continue;
            }
            for(let optn of stationData[key]){
                console.log(optn);
                if(val.findIndex((item) => item.fieldId === optn.fieldId) !== -1){
                    dispatch(showToast({
                        showToast: true,
                        toastType: 'error',
                        toastMessage: 'Already Selected for another station'
                    }));
                    return;
                }
            }
        }

        field.onChange(val);

    }, [getValues, dispatch]);

    if(!selectedSubFieldDict || selectedFieldArray.length === 0 ||
        Object.values(selectedSubFieldDict).length === 0 || 
        Object.values(selectedSubFieldDict).filter((item) => item.length === 0).length > 0){
        return (
            <div className={styles.selectSubField}>
                <div className={styles.body__title}>
                    Configure Data Collection Stations
                </div>
                <div className={styles.selectSubField__error_message}>
                    No Field Selected in Previous step
                </div>
            </div>
        );
    }

    return (
        <div className={styles.selectStation}>
            <div className={styles.body__title}>
                Configure Data Collection Stations
            </div>
            <div className={styles.selectStation__input}>
                <div className={styles.selectStation__input__label}>
                    No. of Stations
                </div>
                <div className={styles.selectStation__input__input}>
                    <input type="number" min={0} value={numStations} onChange={(e) => {
                        let val = e.target.value? parseInt(e.target.value) : 0;
                        setNumStations(val);
                        let prevNumStations = getValues("numStations");
                        if(prevNumStations > val){
                            for(let i = prevNumStations; i >= val; i--){
                                setValue(`stationData[id_${i}]`, []);
                            }
                        }
                        setValue("numStations", val);
                    }} />
                </div>
            </div>
            <div className={styles.selectStation__select}>
                {[...Array(numStations)].map((_, idx) => {
                    return (
                        <div className={styles.selectStation__select__item} key={idx}>
                            <div className={styles.selectStation__select__item__label}>
                                Station {idx + 1}
                            </div>
                            <div className={styles.selectStation__select__item__select}>
                                <Controller
                                    name={`stationData[id_${idx}]`}
                                    control={control}
                                    rules={{ required: 'This field is required.' }}
                                    render={({ field }) => (
                                        <MultiSelect className={styles.multiselect}
                                            id={field.id} 
                                            value={field.value} 
                                            optionLabel="fieldName" 
                                            options={selectedFieldArray} 
                                            onChange={(e) => {
                                                // field.onChange(e.value);
                                                handleOptionSelection(e.value, field, idx);
                                            }} 
                                            filter={true}
                                            display="chip"
                                            placeholder="Select Fields"/>
                                    )}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );    
};

const PageLogicTemplate = ({control, getValues, setValue, register, stationId, pageIdx}) => {
    const [ conditions, setConditions ] = useState(getValues(`pages.config.stn_${stationId}.pg_${pageIdx}.conditions`)??[]);
    const [ logicOption, setLogicOption ] = useState(getValues(`pages.config.stn_${stationId}.pg_${pageIdx}.logicOption`));
    const [ numStations, _ ] = useState(getValues("numStations") || 0);
    const [ conditionOptions, setConditionOptions ] = useState([]);
    
    useEffect(() => {
        const stationData = getValues("stationData");
        let fieldArray = stationData[`id_${stationId}`];
        let selectedSubFieldDict = getValues("selectedSubFieldDict");
        let conditionOptions = [];
        for(let field of fieldArray){
            let subFieldArray = selectedSubFieldDict[`id_${field.fieldId}`];
            for(let subField of subFieldArray){
                conditionOptions.push({
                    fieldId: field.fieldId,
                    subFieldId: subField.subFieldId,
                    fieldName: field.fieldName,
                    subFieldName: subField.subFieldName,
                });
            }
        }
        setConditionOptions(conditionOptions);
    }, [stationId, getValues]);

    const operators = [
        {label: '==', value: 'eq'},
        {label: '!=', value: 'neq'},
        {label: '>', value: 'gt'},
        {label: '>=', value: 'gte'},
        {label: '<', value: 'lt'},
        {label: '<=', value: 'lte'},
    ];

    return (
        <Accordion className="page__logic">
            <AccordionTab header="Page Logic">
                <div className={styles.page__logic__container}>
                    <div className={styles.page__logic__container__body}>
                        <div className={styles.page__logic__container__body__item}>
                            {/* <div className={styles.page__logic__container__body__item__label}>
                                Option:
                            </div> */}
                            <div className={styles.page__logic__container__body__item__input}>
                                <div className={styles.page__logic__container__body__item__select__radio}>
                                    <input type="radio" value="api" id="ApiOption"
                                        {...register(`pages.config.stn_${stationId}.pg_${pageIdx}.logicOption`,
                                            {
                                                onChange: (e)=>{ setLogicOption(e.target.value) }
                                            })
                                        } />
                                    <label htmlFor="ApiOption">API Option</label>
                                </div>
                                <div className={styles.page__logic__container__body__item__select__radio}>
                                    <input type="radio" value="conditional" id="Conditional"
                                        {...register(`pages.config.stn_${stationId}.pg_${pageIdx}.logicOption`,
                                            {
                                                onChange: (e)=>{ setLogicOption(e.target.value) }
                                            })
                                        } />    
                                    <label htmlFor="Conditional">Conditional Statement</label>
                                </div>
                            </div>
                        </div>
                        {logicOption === "api" && 
                        <div className={styles.page__logic__container__body__item}>
                            <div className={styles.page__logic__container__body__item__label}>
                                API Endpoint
                            </div>
                            <div className={styles.page__logic__container__body__item__input}>
                                <input type="text" {...register(`pages.config.stn_${stationId}.pg_${pageIdx}.apiEndpoint`)} />
                            </div>
                        </div>}
                        {logicOption === "conditional" && 
                        <div className={styles.page__logic__container__body__item}>
                            <div className={styles.page__logic__container__body__item__actions}>
                                <div className={styles.page__logic__container__body__item__actions__add} onClick={()=>setConditions(prev => [ ...prev, {} ])}>
                                    <i className="pi pi-plus-circle"></i>
                                    <div className={styles.page__logic__container__body__item__actions__add__label}>
                                        Add
                                    </div>
                                </div>
                                <div className={styles.page__logic__container__body__item__actions__remove} onClick={()=>{
                                        let newConditions = [...conditions];
                                        newConditions.splice(newConditions.length-1, 1);
                                        setConditions(newConditions);
                                    }}>
                                    <i className="pi pi-minus-circle"></i>
                                    <div className={styles.page__logic__container__body__item__actions__remove__label}>
                                        Remove
                                    </div>
                                </div>
                            </div>
                            <div className={styles.page__logic__container__body__item__logic}>
                                {conditions?.map((_, cIdx) => (
                                    <div className={styles.page__logic__container__body__item__logic__row} key={cIdx}>
                                        <div className={styles.page__logic__container__body__item__logic__row__field}>
                                            <select {...register(`pages.config.stn_${stationId}.pg_${pageIdx}.conditions[${cIdx}].field`)}>
                                                {conditionOptions.map((fItem, fIdx) => <option value={`${fItem.fieldId}:${fItem.subFieldId}`} key={fIdx}>{fItem.fieldName}: {fItem.subFieldName}</option>)}
                                            </select>
                                        </div>
                                        <div className={styles.page__logic__container__body__item__logic__row__operator}>
                                            <select {...register(`pages.config.stn_${stationId}.pg_${pageIdx}.conditions[${cIdx}].operator`)}>
                                                {operators.map((oItem, oIdx) => <option value={oItem.value} key={oIdx}>{oItem.label}</option>)}
                                            </select>
                                        </div>
                                        <div className={styles.page__logic__container__body__item__logic__row__value}>
                                            <input type="text" {...register(`pages.config.stn_${stationId}.pg_${pageIdx}.conditions[${cIdx}].value`)} />
                                        </div>
                                    </div>))}
                            </div>
                            <div className={styles.page__logic__container__body__item__logic__condition}>
                                <div className={styles.page__logic__container__body__item__logic__condition__radio}>
                                    <input type="radio" value="all" id="all" {...register(`pages.config.stn_${stationId}.pg_${pageIdx}.logicCondition`)} />
                                    <label htmlFor="all">ALL</label>
                                </div>
                                <div className={styles.page__logic__container__body__item__logic__condition__radio}>
                                    <input type="radio" value="any" id="any" {...register(`pages.config.stn_${stationId}.pg_${pageIdx}.logicCondition`)} />
                                    <label htmlFor="any">ANY</label>
                                </div>
                            </div>
                        </div>}
                        <div className={styles.page__logic__container__body__item__logic__result}>
                            <div className={styles.page__logic__container__body__item__logic__result__select}>
                                <label htmlFor="yes">True</label>
                                <select id="yes" {...register(`pages.config.stn_${stationId}.pg_${pageIdx}.result.true.stationId`)}>
                                    {[...Array(numStations)].map((_, sIdx) => <option value={sIdx} key={sIdx}>Station {sIdx+1}</option>)}
                                </select>
                                <input type="number" placeholder="Enter Page No." {...register(`pages.config.stn_${stationId}.pg_${pageIdx}.result.true.pageNum`)} />
                            </div>
                            <div className={styles.page__logic__container__body__item__logic__result__select}>
                                <label htmlFor="no">False</label>
                                <select id="no" {...register(`pages.config.stn_${stationId}.pg_${pageIdx}.result.false.stationId`)}>
                                    {[...Array(numStations)].map((_, sIdx) => <option value={sIdx} key={sIdx}>Station {sIdx+1}</option>)}
                                </select>
                                <input type="number" placeholder="Enter Page No." {...register(`pages.config.stn_${stationId}.pg_${pageIdx}.result.false.pageNum`)} />
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionTab>
        </Accordion>
    );
};

const ConfigurePageTemplate = ({control, getValues, setValue, register, watch, stationId}) => {
    const [ stnPages, setStnPages ] = useState(getValues(`pages.idx_${stationId}`)??[]);
    const selectedSubFieldDict = getValues("selectedSubFieldDict");

    const [ fields, setFields ] = useState([]);

    console.log("Stations ID", stationId);
    useEffect(() => {
        const stationData = getValues("stationData");
        setStnPages(getValues(`pages.idx_${stationId}`)??[]);

        let data = stationData[`id_${stationId}`]??[];
        let fieldsDataArray = [];
        for(let f of data){
            let key = `id_${f.fieldId}`;
            if(!(key in selectedSubFieldDict)){
                // Do Nothing
            }
            else{
                console.log("Yes")
                fieldsDataArray.push({
                    ...f,
                    selectedSubFields: selectedSubFieldDict[`id_${f.fieldId}`]
                });
            }
        }
        console.log("data", fieldsDataArray);
        setFields(fieldsDataArray);
        console.log("stationData", stationData[`id_${stationId}`]);
    }, [stationId, getValues, selectedSubFieldDict]);

    useEffect(() => {
        setValue(`pages.idx_${stationId}`, stnPages);
        console.log("pages", getValues());
        console.log("stnPages", stnPages);
    }, [stnPages.length, stationId, stnPages, getValues, setValue ]);

    return (
        <div className={styles.page__container}>
            <div className={styles.page__container__header}>
                <div className={styles.add_page} type="button" 
                    onClick={()=>{
                        setStnPages((prev)=>[...prev, {}]);
                    }}>
                        <i className="pi pi-plus-circle"></i>
                        Add Page
                    </div>
            </div>
            <div className={styles.page__container__body}>
                {stnPages.length === 0 && <div className={styles.page__container__error_message}>
                    No Page Added
                </div>}
                {stnPages.length >0 && <Accordion className={styles.page__container__body__item}>
                    {stnPages.map((_, pageIdx) => {
                        return (
                        <AccordionTab header={
                            <div className={styles.page__container__body__item__header}>
                                <div className={styles.page__container__body__item__header__title}>
                                    Page {pageIdx + 1}
                                </div>
                                <div className={styles.page__container__body__item__header__actions}>
                                    <i style={{padding: '5px'}} className="pi pi-minus-circle" onClick={()=>{
                                        setStnPages((prev)=>prev.filter((_, i)=>i!==pageIdx));
                                        setValue(`pages.config.stn_${stationId}.pg_${pageIdx}`, {});
                                    }}></i>
                                </div>
                            </div>
                        } key={pageIdx}>
                            <div className={styles.selectSubField__select}>
                                {fields.map((field, field_idx) => (
                                    <div className={styles.selectSubField__select__item} key={field_idx}>
                                        <div className={styles.selectSubField__select__item__label}>
                                            {field.fieldName}
                                        </div>
                                        <div className={styles.selectSubField__select__item__select}>
                                            <Controller
                                                name={`pages.config.stn_${stationId}.pg_${pageIdx}.fields.id_${field.fieldId}`}
                                                control={control}
                                                defaultValue={[]}
                                                render={({ field }) => {
                                                    return (
                                                        <ListBox className="subField_list" 
                                                        value={field.value} 
                                                        multiple
                                                        placeholder="Select Sub Fields" 
                                                        name="value" 
                                                        options={fields[field_idx].selectedSubFields} 
                                                        control={control} 
                                                        onChange={(e) => {
                                                            console.log(e);
                                                            setValue(field.name, e.value);
                                                        }}
                                                        itemTemplate={(item) => (
                                                            <div className={styles.picklist__item}>
                                                                <span className="radio"></span>
                                                                <div className="item">{item.subFieldName}</div>
                                                            </div>
                                                        )}
                                                        />
                                                    );
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <PageLogicTemplate control={control} getValues={getValues} setValue={setValue} 
                                register={register} watch={watch} stationId={stationId} pageIdx={pageIdx} />
                        </AccordionTab>
                    )})}
                </Accordion>}
            </div>
        </div>
    );
};

const ConfigureStationTemplate = ({control, getValues, setValue, register, watch}) => {
    const selectedSubFieldDict = getValues("selectedSubFieldDict");
    const selectedFieldArray = getValues("fieldArray");
    const numStations = getValues("numStations");

    const [ stationId, setStationId ] = useState(0);

    console.log(numStations, selectedFieldArray)

    if(!selectedSubFieldDict || selectedFieldArray.length === 0 ||
        Object.values(selectedSubFieldDict).length === 0 || 
        Object.values(selectedSubFieldDict).filter((item) => item.length === 0).length > 0 ||
        !numStations || numStations === 0){
            return (
                <div className={styles.selectSubField}>
                    <div className={styles.body__title}>
                        Configure Data Collection Stations
                    </div>
                    <div className={styles.selectSubField__error_message}>
                        No configuration done in Previous step
                    </div>
                </div>
            );
    }

    const items = [];
    
    for(let i=0; i<numStations; i++){
        items.push({
            label: `Station ${i+1}`,
            command: (_) => {
                setStationId(i);
            }
        });
    }

    return (
        <div className={styles.configStation}>
            <div className={styles.body__title}>
                Configure Data Collection Stations
            </div>
            <div className={styles.configStation__body}>
                <div className={styles.configStation__numStation__label}>
                    <Steps model={items} activeIndex={stationId} readOnly={false} />
                </div>
                <div className={styles.configStation__pages__panel}>
                    <ConfigurePageTemplate control={control} getValues={getValues} setValue={setValue} 
                        register={register} stationId={stationId} watch={watch} />
                </div>
            </div>
        </div>
    );
};

const CreateFormPopup = (props) => {

    const  user = useSelector(state => state.user);
    const { register, control, setValue, getValues, handleSubmit, watch } = useForm({});

    const dispatch = useDispatch();
    
    useEffect(() => {
        dispatch(fetchAllFields());
        // dispatch(showToast({toastType: 'error', toastMessage:'Error occured'}));
    }, [dispatch]);

    // Page Functions
    const [ currentPageIndex, setCurrentPageIndex ] = useState(0);
    const [ pageFunctions, setPageFunctions ] = useState([]);

    useEffect(() => {
        setPageFunctions([
            <SelectFieldTemplate control={control} />,
            <SelectSubFieldTemplate control={control} getValues={getValues} setValue={setValue} />,
            <SelectStationTemplate control={control} register={register} getValues={getValues} setValue={setValue} />,
            <ConfigureStationTemplate control={control} register={register} getValues={getValues} setValue={setValue} watch={watch} />
        ]);
    }, [control, getValues, setValue, register, watch]);


    

    const onSubmit = (data) => {
        try{
            console.log(data);

            let stations = [];
            for(let key of Object.keys(data['pages']['config'])){
                let stationId = key.split('_')[1];
                let pages = data['pages']['config'][key];
                
                let stationData = {
                    field_count: Array(data['stationData'][`id_${stationId}`]).length,
                    fields: (data['stationData'][`id_${stationId}`]).map((field) => {
                        return field.fieldId
                    }),
                    page_count: Object.keys(pages).length,
                    pages: []
                };
        
                for(let pageKey of Object.keys(pages)){
                    let pageId = pageKey.split('_')[1];
                    let pageData = {
                        page_id: pageId,
                        subfield_count: Array(pages[pageKey]['conditions']).length,
                        subfields: pages[pageKey]['conditions']?.map((optn) => {
                            return {
                                field_id : optn.field.fieldId, 
                                subfield_id : optn.field.subFieldId
                            }
                        }),
                        logic: {
                            external_api: pages[pageKey]['logicOption'] === 'api',
                            operation: pages[pageKey]['logicCondition'] === 'all' ? 'and' : 'or',
                            external_api_id: pages[pageKey]['apiEndpoint'],
                            logic: pages[pageKey]['conditions']?.map((optn) => {
                                return {
                                    field_id : optn.field.split(':')[0], 
                                    subfield_id : optn.field.split(':')[1],
                                    operation: optn.operator,
                                    value: optn.value
                                }
                            })
                        },
                        destination_true: {
                            station_id: pages[pageKey]['result']['true']['stationId'],
                            page_id: pages[pageKey]['result']['true']['pageNum']
                        },

                        destination_false: {
                            station_id: pages[pageKey]['result']['false']['stationId'],
                            page_id: pages[pageKey]['result']['false']['pageNum']
                        }
                    };
        
                    stationData.pages.push(pageData);
                }
        
                stations.push(stationData);
            };
        
            const formData = {
                form_name: data.formName,
                created_by: user.id,
                created_date: new Date().toLocaleDateString(),
                stations: [ ...stations ]
            };
        
            console.log(formData);
            console.log(JSON.stringify(formData));

            dispatch(saveFormData(formData));

            props.onClose();

        }
        catch(err){
            console.log(err);
            dispatch(showToast({toastType: 'error', toastMessage:'Something went wrong, Please check the form data'}));
        }
    
    };

    return (
        <div className={styles.container}>
            <form className={styles.form}  onClick={handleSubmit}>
                <div className={styles.header}>
                    <div className={styles.header__body}>
                        <div className={styles.header__title}>
                            <input type="text" placeholder="Form Name" {...register("formName", {required: "This field is required."})}/>
                        </div>
                        <div className={styles.header__metadata}>
                            <div className={styles.header__metadata__item}>
                                Created By: {user.firstName} {user.lastName}
                            </div>
                            <div className={styles.header__metadata__item}>
                                Date created: {new Date().toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    <div className={styles.header__close}>
                        <i className="pi pi-times-circle" onClick={props.onClose}></i>
                    </div>
                </div>
                <div className={styles.body}>
                    {pageFunctions[currentPageIndex]}
                </div>
                <div className={styles.footer}>
                    {/* <button type="button" disabled={currentPageIndex === 0} onClick={() => {setCurrentPageIndex(prev => prev-1)}}>Previous</button> */}
                    {/* <button type="button" >Save</button> */}
                    {/* <button type="submit" hidden={currentPageIndex !== (pageFunctions.length - 1)}>Submit</button> */}
                </div>
            </form>
        </div>
    );
        
};

export default CreateFormPopup;