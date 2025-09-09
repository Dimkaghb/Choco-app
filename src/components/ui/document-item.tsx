

export const DocumentItem = (props: any) => {

    return(
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="w-8 h-8 rounded-md flex-shrink-0">
                <img className="w-full h-full object-contain" src={props.docType == 'xlsx' ? require('@/assets/icons/xlsx.svg') : require('@/assets/icons/pdf.svg')} alt="" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{props.docName}</p>
                <p className="text-xs text-muted-foreground">{props.docSize}</p>
            </div>
            <button 
                onClick={() => props.handleRemoveDocument(props.docId)} 
                className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-400/10 transition-colors flex-shrink-0"
            >
                Удалить
            </button>
        </div>
    )

}