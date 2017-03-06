It's Object Storage Training for S3. Basically it allows you to interface with your S3 buckets but you can also see what calls are being made in the backend in the little console.

# Install

```npm install```

You will also need to create config.json file one directory above this one.

Should look something like this:

```
{ 
  "accessKeyId": "S3 ACCESS KEY ID",
  "secretAccessKey": "S3 SECRET ACCEESS KEY", 
  "region": "S3-REGION" 
}
```

# Run

```npm start```

Then vist http://localhost/ 

# TODO

try https://github.com/vote539/socketio-file-upload for upload and progress bar

syntax highlighting for console  http://jsfiddle.net/KJQ9K/554/

add delteing when deleteing buckets

clear metainpt form after upload

display more than one metadata

fix object not being selected on creation

build front end for s3 authentication

