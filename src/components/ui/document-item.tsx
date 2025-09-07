

export const DocumentItem = (props: any) => {

    return(
        <div className="flex items-center p-15 rounded-lg justify-between">


            <div className="w-20 h-20 rounded-md">
                <img className ="w-full h-full" src={props.docType == 'xlsx' ? require('@/assets/icons/xlsx.svg') : require('@/assets/icons/pdf.svg')} alt="" />
            </div>
            <div>
                <p className="text-lg font-bold">{props.docName}</p>

                <p className="text-sm text-gray-500">{props.docSize}</p>
                <button onClick={() => props.handleRemoveDocument(props.docId)} className="text-red-500">Удалить</button>
            </div>
            
        </div>
    )

}